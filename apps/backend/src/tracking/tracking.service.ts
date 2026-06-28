import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { GeofencingService } from '../geofencing/geofencing.service';
import { ValhallaService } from '../maps/valhalla.service';
import { TripStatus } from '@prisma/client';

@Injectable()
export class TrackingService {
  private readonly CACHE_TTL_SECONDS = 60; // 1 minute cache

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private geofencingService: GeofencingService,
    private valhallaService: ValhallaService,
  ) {}

  async getLiveTripLocation(tripId: string) {
    // Check cache first
    const cacheKey = `tracking:live:${tripId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fetch from database
    const trackingPoint = await this.prisma.trackingPoint.findFirst({
      where: { tripId },
      orderBy: { timestamp: 'desc' },
    });

    if (!trackingPoint) {
      return null;
    }

    const result = {
      tripId,
      lat: trackingPoint.lat,
      lng: trackingPoint.lng,
      accuracy: trackingPoint.accuracy,
      timestamp: trackingPoint.timestamp,
    };

    // Cache the result
    await this.redis.setex(cacheKey, this.CACHE_TTL_SECONDS, JSON.stringify(result));

    return result;
  }

  async getTripTrackingHistory(tripId: string, limit: number = 100) {
    const trackingPoints = await this.prisma.trackingPoint.findMany({
      where: { tripId },
      orderBy: { timestamp: 'asc' },
      take: Number(limit),
    });

    return trackingPoints.map(point => ({
      id: point.id,
      tripId: point.tripId,
      lat: point.lat,
      lng: point.lng,
      accuracy: point.accuracy,
      timestamp: point.timestamp,
    }));
  }

  async getAllActiveTripsLocations() {
    const activeTrips = await this.prisma.trip.findMany({
      where: {
        status: { in: [TripStatus.ASSIGNED, TripStatus.IN_TRANSIT] },
      },
      include: {
        driver: { include: { user: true } },
        vehicle: true,
        order: true,
      },
    });

    const locations = await Promise.all(
      activeTrips.map(async (trip) => {
        const location = await this.getLiveTripLocation(trip.id);
        return {
          tripId: trip.id,
          trip,
          location,
        };
      }),
    );

    return locations.filter(l => l.location !== null);
  }

  async calculateRoute(tripId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: { order: true },
    });

    if (!trip || !trip.order) {
      throw new Error('Trip not found');
    }

    const pickup = trip.order.pickupLocation as { lat: number; lng: number; address: string };
    const delivery = trip.order.deliveryLocation as { lat: number; lng: number; address: string };

    // Get tracking history for actual path
    const trackingHistory = await this.getTripTrackingHistory(tripId, 1000);

    // Attempt Valhalla route, fall back to straight-line
    const valhallaRoute = await this.valhallaService.getRoute(pickup, delivery);
    const distance = valhallaRoute?.distanceMeters ?? this.calculateDistance(pickup, delivery);

    const route = {
      polyline: valhallaRoute?.polyline ?? [
        { lat: pickup.lat, lng: pickup.lng },
        { lat: delivery.lat, lng: delivery.lng },
      ],
      distance,
      estimatedDuration: valhallaRoute?.durationSeconds ?? Math.round(distance / 30),
      pickup,
      delivery,
      trackingHistory,
    };

    return route;
  }

  async getGeofenceZones() {
    const geofences = await this.prisma.geofence.findMany({
      where: { isActive: true },
    });

    return geofences.map(geofence => ({
      id: geofence.id,
      name: geofence.name,
      type: geofence.type,
      center: geofence.centerLat !== null && geofence.centerLng !== null 
        ? { lat: geofence.centerLat, lng: geofence.centerLng } 
        : undefined,
      radiusA: geofence.radiusA,
      radiusB: geofence.radiusB,
      radiusC: geofence.radiusC,
      radiusD: geofence.radiusD,
      polygon: geofence.polygon as { lat: number; lng: number }[] | undefined,
      color: this.getGeofenceColor(geofence.type),
    }));
  }

  async processLocationUpdate(tripId: string, lat: number, lng: number, accuracy?: number) {
    // Store tracking point
    const trackingPoint = await this.prisma.trackingPoint.create({
      data: {
        tripId,
        lat,
        lng,
        accuracy,
        timestamp: new Date(),
      },
    });

    // Invalidate cache
    await this.redis.del(`tracking:live:${tripId}`);

    // Process geofencing
    const geofenceResult = await this.geofencingService.processGPSUpdate(tripId, {
      lat,
      lng,
      accuracy,
    });

    // Publish to Redis for WebSocket
    await this.redis.publish('tracking:location', JSON.stringify({
      tripId,
      lat,
      lng,
      accuracy,
      timestamp: trackingPoint.timestamp,
      geofenceEvents: geofenceResult.geofenceEvents || [],
    }));

    return trackingPoint;
  }

  async getLivePackageLocation(packageTrackerId: string) {
    const cacheKey = `tracking:package:live:v2:${packageTrackerId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const [trackingPoint, packageTracker] = await Promise.all([
      this.prisma.packageTrackingPoint.findFirst({
        where: { packageTrackerId },
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.packageTracker.findUnique({
        where: { id: packageTrackerId },
        select: {
          id: true,
          deviceId: true,
          name: true,
          status: true,
        },
      }),
    ]);

    if (!trackingPoint) {
      return null;
    }

    const result = {
      packageTrackerId,
      packageTracker,
      lat: trackingPoint.lat,
      lng: trackingPoint.lng,
      accuracy: trackingPoint.accuracy,
      speed: trackingPoint.speed,
      heading: trackingPoint.heading,
      timestamp: trackingPoint.timestamp,
    };

    await this.redis.setex(cacheKey, this.CACHE_TTL_SECONDS, JSON.stringify(result));
    return result;
  }

  async getPackageTrackingHistory(packageTrackerId: string, limit: number = 100) {
    const trackingPoints = await this.prisma.packageTrackingPoint.findMany({
      where: { packageTrackerId },
      orderBy: { timestamp: 'asc' },
      take: Number(limit),
    });

    return trackingPoints.map(point => ({
      id: point.id,
      packageTrackerId: point.packageTrackerId,
      lat: point.lat,
      lng: point.lng,
      accuracy: point.accuracy,
      speed: point.speed,
      heading: point.heading,
      timestamp: point.timestamp,
    }));
  }

  async processPackageLocationUpdate(
    packageTrackerId: string,
    lat: number,
    lng: number,
    accuracy?: number,
    speed?: number,
    heading?: number,
  ) {
    const trackingPoint = await this.prisma.packageTrackingPoint.create({
      data: {
        packageTrackerId,
        lat,
        lng,
        accuracy,
        speed,
        heading,
        timestamp: new Date(),
      },
    });

    // Update tracker last known location
    await this.prisma.packageTracker.update({
      where: { id: packageTrackerId },
      data: {
        lastLat: lat,
        lastLng: lng,
        lastSeenAt: trackingPoint.timestamp,
      },
    });

    // Invalidate cache
    await this.redis.del(`tracking:package:live:v2:${packageTrackerId}`);

    // Publish to Redis for WebSocket
    await this.redis.publish('tracking:package:location', JSON.stringify({
      packageTrackerId,
      lat,
      lng,
      accuracy,
      speed,
      heading,
      timestamp: trackingPoint.timestamp,
    }));

    return trackingPoint;
  }

  async getPackageTrackerLocationByOrderId(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { packageTracker: true },
    });

    if (!order?.packageTrackerId) {
      return null;
    }

    const location = await this.getLivePackageLocation(order.packageTrackerId);
    return {
      orderId,
      packageTrackerId: order.packageTrackerId,
      packageTracker: order.packageTracker,
      location,
    };
  }

  private calculateDistance(
    p1: { lat: number; lng: number },
    p2: { lat: number; lng: number },
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (p1.lat * Math.PI) / 180;
    const φ2 = (p2.lat * Math.PI) / 180;
    const Δφ = ((p2.lat - p1.lat) * Math.PI) / 180;
    const Δλ = ((p2.lng - p1.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  private getGeofenceColor(type: string): string {
    const colors: Record<string, string> = {
      RADIUS_A: '#FFA500', // Orange
      RADIUS_B: '#FF8C00', // Dark orange
      RADIUS_C: '#00FF00', // Green
      POLYGON: '#0000FF', // Blue
    };
    return colors[type] || '#808080';
  }
}
