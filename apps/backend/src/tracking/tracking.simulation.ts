import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import axios from 'axios';

interface GeofenceState {
  radiusAEntered: boolean;
  radiusBEntered: boolean;
  radiusCEntered: boolean;
  arrivalConfirmed: boolean;
}

@Injectable()
export class TrackingSimulationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TrackingSimulationService.name);
  private simulationInterval: NodeJS.Timeout | null = null;
  private routePoints: { lat: number; lng: number }[] = [];
  private currentRouteIndex = 0;
  private readonly GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';
  private geofenceStates: Map<string, GeofenceState> = new Map();

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async onModuleInit() {
    // Start simulation after 5 seconds
    setTimeout(() => this.startSimulation(), 5000);
  }

  async onModuleDestroy() {
    this.stopSimulation();
  }

  private startSimulation() {
    this.logger.log('Starting tracking simulation...');
    this.simulationInterval = setInterval(() => {
      this.simulateVehicleMovement();
    }, 60000); // Update every 60 seconds (event-driven, less frequent updates)
  }

  private stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
      this.logger.log('Tracking simulation stopped');
    }
  }

  private async simulateVehicleMovement() {
    try {
      // Specifically track the Festac Town shipment (trip-7)
      const activeTrip = await this.prisma.trip.findFirst({
        where: {
          id: 'trip-7',
          status: { in: ['IN_TRANSIT', 'ASSIGNED'] },
        },
        include: {
          order: true,
        },
      });

      if (!activeTrip) {
        this.logger.debug('No active trips found');
        return;
      }

      // Get pickup and delivery locations
      const pickup = activeTrip.order.pickupLocation as { lat: number; lng: number };
      const delivery = activeTrip.order.deliveryLocation as { lat: number; lng: number };

      // Initialize route points if not already done
      if (this.routePoints.length === 0) {
        await this.fetchRoute(pickup, delivery);
      }

      // Get the last tracking point for this trip
      const lastPoint = await this.prisma.trackingPoint.findFirst({
        where: { tripId: activeTrip.id },
        orderBy: { timestamp: 'desc' },
      });

      // Move to next point on the route
      if (this.currentRouteIndex < this.routePoints.length) {
        const nextPoint = this.routePoints[this.currentRouteIndex];
        
        // Calculate speed based on distance (realistic speed: 30-50 km/h)
        const speed = 30 + Math.random() * 20;
        const accuracy = 8 + Math.random() * 5;
        
        // Calculate heading based on movement direction
        let heading = 0;
        if (lastPoint) {
          const deltaLat = nextPoint.lat - lastPoint.lat;
          const deltaLng = nextPoint.lng - lastPoint.lng;
          heading = Math.atan2(deltaLng, deltaLat) * (180 / Math.PI);
          if (heading < 0) heading += 360;
        }

        // Create new tracking point
        const newPoint = await this.prisma.trackingPoint.create({
          data: {
            tripId: activeTrip.id,
            lat: nextPoint.lat,
            lng: nextPoint.lng,
            accuracy,
            speed,
            heading,
            timestamp: new Date(),
          },
        });

        // Calculate distance from delivery location (in meters)
        const distanceToDelivery = this.calculateDistance(
          nextPoint.lat,
          nextPoint.lng,
          delivery.lat,
          delivery.lng
        );

        // Check and trigger geofence events
        await this.checkGeofenceEvents(activeTrip.id, nextPoint, distanceToDelivery, delivery);

        // Publish to Redis for WebSocket broadcast
        await this.redis.publish('tracking:location', JSON.stringify({
          tripId: activeTrip.id,
          lat: nextPoint.lat,
          lng: nextPoint.lng,
          accuracy,
          speed,
          heading,
          timestamp: newPoint.timestamp,
        }));

        this.logger.debug(`Simulated movement for trip ${activeTrip.id}: ${nextPoint.lat.toFixed(6)}, ${nextPoint.lng.toFixed(6)} | Distance to delivery: ${distanceToDelivery.toFixed(0)}m`);

        this.currentRouteIndex++;
      } else {
        // Trip completed - reset route
        this.logger.log(`Trip ${activeTrip.id} completed, resetting route`);
        this.routePoints = [];
        this.currentRouteIndex = 0;
        this.geofenceStates.delete(activeTrip.id);
      }
    } catch (error) {
      this.logger.error('Error simulating vehicle movement:', error);
    }
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private async checkGeofenceEvents(
    tripId: string,
    currentLocation: { lat: number; lng: number },
    distanceToDelivery: number,
    deliveryLocation: { lat: number; lng: number }
  ) {
    // Initialize geofence state for this trip if not exists
    if (!this.geofenceStates.has(tripId)) {
      this.geofenceStates.set(tripId, {
        radiusAEntered: false,
        radiusBEntered: false,
        radiusCEntered: false,
        arrivalConfirmed: false,
      });
    }

    const state = this.geofenceStates.get(tripId)!;

    // Radius A: 5km (5000m) - Early Awareness Zone
    if (!state.radiusAEntered && distanceToDelivery <= 5000) {
      state.radiusAEntered = true;
      await this.publishGeofenceEvent(tripId, 'RADIUS_A_ENTERED', {
        distance: distanceToDelivery,
        location: currentLocation,
      });
      this.logger.log(`Trip ${tripId}: Entered Radius A (5km) at ${distanceToDelivery.toFixed(0)}m`);
    }

    // Radius B: 1km (1000m) - Approaching Zone
    if (!state.radiusBEntered && distanceToDelivery <= 1000) {
      state.radiusBEntered = true;
      await this.publishGeofenceEvent(tripId, 'RADIUS_B_ENTERED', {
        distance: distanceToDelivery,
        location: currentLocation,
      });
      this.logger.log(`Trip ${tripId}: Entered Radius B (1km) at ${distanceToDelivery.toFixed(0)}m`);
    }

    // Radius C: 100m - Arrival Zone
    if (!state.radiusCEntered && distanceToDelivery <= 100) {
      state.radiusCEntered = true;
      await this.publishGeofenceEvent(tripId, 'RADIUS_C_ENTERED', {
        distance: distanceToDelivery,
        location: currentLocation,
      });
      this.logger.log(`Trip ${tripId}: Entered Radius C (100m) at ${distanceToDelivery.toFixed(0)}m`);
    }

    // Arrival Confirmed (within 50m)
    if (!state.arrivalConfirmed && distanceToDelivery <= 50) {
      state.arrivalConfirmed = true;
      await this.publishGeofenceEvent(tripId, 'ARRIVAL_CONFIRMED', {
        distance: distanceToDelivery,
        location: currentLocation,
      });
      await this.publishGeofenceEvent(tripId, 'DELIVERY_WORKFLOW_TRIGGERED', {
        distance: distanceToDelivery,
        location: currentLocation,
      });
      this.logger.log(`Trip ${tripId}: Arrival confirmed at ${distanceToDelivery.toFixed(0)}m`);
    }
  }

  private async publishGeofenceEvent(
    tripId: string,
    eventType: string,
    data: any
  ) {
    const event = {
      id: `geofence-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      tripId,
      eventType,
      timestamp: new Date().toISOString(),
      data,
    };

    // Publish to Redis for WebSocket broadcast
    await this.redis.publish('geofence:event', JSON.stringify(event));
    this.logger.debug(`Published geofence event: ${eventType} for trip ${tripId}`);
  }

  private async fetchRoute(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }) {
    try {
      if (!this.GOOGLE_API_KEY) {
        this.logger.warn('Google Maps API key not found, using straight-line route');
        this.generateStraightLineRoute(origin, destination);
        return;
      }

      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json`,
        {
          params: {
            origin: `${origin.lat},${origin.lng}`,
            destination: `${destination.lat},${destination.lng}`,
            key: this.GOOGLE_API_KEY,
            mode: 'driving',
          },
        },
      );

      if (response.data.status === 'OK' && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        const points = this.decodePolyline(route.overview_polyline.points);
        // Sample points to reduce frequency (every 10th point)
        this.routePoints = points.filter((_, index) => index % 10 === 0);
        this.logger.log(`Fetched route with ${this.routePoints.length} points`);
      } else {
        this.logger.warn('Failed to fetch route, using straight-line route');
        this.generateStraightLineRoute(origin, destination);
      }
    } catch (error) {
      this.logger.error('Error fetching route from Google Maps:', error);
      this.generateStraightLineRoute(origin, destination);
    }
  }

  private decodePolyline(encoded: string): { lat: number; lng: number }[] {
    const points: { lat: number; lng: number }[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let shift = 0;
      let result = 0;
      let byte;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      lat += (result & 1) !== 0 ? ~(result >> 1) : result >> 1;

      shift = 0;
      result = 0;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      lng += (result & 1) !== 0 ? ~(result >> 1) : result >> 1;

      points.push({ lat: lat / 1e5, lng: lng / 1e5 });
    }

    return points;
  }

  private generateStraightLineRoute(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }) {
    const numPoints = 50;
    this.routePoints = [];
    for (let i = 0; i <= numPoints; i++) {
      const ratio = i / numPoints;
      this.routePoints.push({
        lat: origin.lat + (destination.lat - origin.lat) * ratio,
        lng: origin.lng + (destination.lng - origin.lng) * ratio,
      });
    }
    this.logger.log(`Generated straight-line route with ${this.routePoints.length} points`);
  }
}
