import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { GeofenceEventType, TripStatus } from '@prisma/client';

interface GPSPoint {
  lat: number;
  lng: number;
  accuracy?: number;
}

interface GeofenceCheckResult {
  eventType?: GeofenceEventType;
  distance: number;
  insidePolygon: boolean;
  geofenceId?: string;
}

@Injectable()
export class GeofencingService {
  private readonly COOLDOWN_SECONDS = 120; // 2 minutes cooldown
  private readonly MIN_MOVEMENT_THRESHOLD = 10; // 10 meters

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async processGPSUpdate(tripId: string, point: GPSPoint) {
    // Filter inaccurate readings
    if (point.accuracy && point.accuracy > 30) {
      return { processed: false, reason: 'Accuracy too low' };
    }

    // Check for duplicate/minimal movement
    const lastPoint = await this.getLastGPSPoint(tripId);
    if (lastPoint) {
      const distance = this.calculateDistance(
        { lat: lastPoint.lat, lng: lastPoint.lng },
        point,
      );
      if (distance < this.MIN_MOVEMENT_THRESHOLD) {
        return { processed: false, reason: 'Minimal movement' };
      }
    }

    // GPS point is already stored by TrackingService - no need to duplicate here

    // Check geofences
    const geofenceResults = await this.checkGeofences(tripId, point);

    // Emit events
    for (const result of geofenceResults) {
      if (result.eventType) {
        await this.emitGeofenceEvent(tripId, result, point);
      }
    }

    return {
      processed: true,
      geofenceEvents: geofenceResults.filter(r => r.eventType).map(r => r.eventType),
    };
  }

  private async checkGeofences(tripId: string, point: GPSPoint): Promise<GeofenceCheckResult[]> {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: { order: true },
    });

    if (!trip) return [];

    // Get destination coordinates from order
    const destination = trip.order.deliveryLocation as { lat: number; lng: number };

    const results: GeofenceCheckResult[] = [];

    // Check radius zones
    const distance = this.calculateDistance(point, destination);

    // Define radius zones (in meters)
    const radiusA = 5000;  // 5km - Early awareness
    const radiusB = 1000;  // 1km - Approaching
    const radiusC = 100;   // 100m - Arrival zone

    // Check each radius zone
    if (distance <= radiusC) {
      results.push({
        eventType: GeofenceEventType.RADIUS_C_ENTERED,
        distance,
        insidePolygon: false,
      });
    } else if (distance <= radiusB) {
      results.push({
        eventType: GeofenceEventType.RADIUS_B_ENTERED,
        distance,
        insidePolygon: false,
      });
    } else if (distance <= radiusA) {
      results.push({
        eventType: GeofenceEventType.RADIUS_A_ENTERED,
        distance,
        insidePolygon: false,
      });
    }

    // Check polygon geofences
    const geofences = await this.prisma.geofence.findMany({
      where: { isActive: true },
    });

    for (const geofence of geofences) {
      if (geofence.type === 'POLYGON' && geofence.polygon) {
        const polygon = geofence.polygon as { lat: number; lng: number }[];
        const insidePolygon = this.isPointInPolygon(point, polygon);

        // Get previous state from Redis for exit detection
        const stateKey = `polygon:state:${tripId}:${geofence.id}`;
        const previousState = await this.redis.get(stateKey);

        // Detect state change
        if (previousState === 'inside' && !insidePolygon) {
          // Exit detected
          results.push({
            eventType: GeofenceEventType.POLYGON_EXITED,
            distance: 0,
            insidePolygon: false,
            geofenceId: geofence.id,
          });
        } else if (previousState !== 'inside' && insidePolygon) {
          // Enter detected
          results.push({
            eventType: GeofenceEventType.POLYGON_ENTERED,
            distance: 0,
            insidePolygon: true,
            geofenceId: geofence.id,
          });
        }

        // Update state in Redis (persist for 24 hours)
        await this.redis.setex(stateKey, 86400, insidePolygon ? 'inside' : 'outside');
      }
    }

    return results;
  }

  private async emitGeofenceEvent(tripId: string, result: GeofenceCheckResult, point: GPSPoint) {
    if (!result.eventType) return;

    const cooldownKey = `geofence:${tripId}:${result.eventType}`;
    const cooldownActive = await this.redis.get(cooldownKey);

    if (cooldownActive) {
      return; // Event on cooldown
    }

    // Set cooldown
    await this.redis.setex(cooldownKey, this.COOLDOWN_SECONDS, '1');

    // Store event — radius events use a synthetic system geofence record if no geofenceId
    let geofenceId = result.geofenceId;
    if (!geofenceId) {
      const systemName = `system:${result.eventType}`;
      let systemGeofence = await this.prisma.geofence.findFirst({
        where: { name: systemName },
      });
      if (!systemGeofence) {
        systemGeofence = await this.prisma.geofence.create({
          data: {
            name: systemName,
            type: 'RADIUS_A' as any,
            isActive: true,
          },
        });
      }
      geofenceId = systemGeofence.id;
    }

    await this.prisma.geofenceEvent.create({
      data: {
        tripId,
        geofenceId,
        eventType: result.eventType,
        lat: point.lat,
        lng: point.lng,
        triggeredAt: new Date(),
      },
    });

    // Special handling for arrival
    if (result.eventType === GeofenceEventType.RADIUS_C_ENTERED) {
      await this.prisma.trip.update({
        where: { id: tripId },
        data: { status: TripStatus.ARRIVED },
      });
    }

    // Publish to 'geofence:event' — the channel the TrackingGateway subscribes to
    await this.redis.publish('geofence:event', JSON.stringify({
      tripId,
      eventType: result.eventType,
      timestamp: new Date().toISOString(),
      distance: result.distance,
      lat: point.lat,
      lng: point.lng,
    }));
  }

  private async getLastGPSPoint(tripId: string) {
    const point = await this.prisma.trackingPoint.findFirst({
      where: { tripId },
      orderBy: { timestamp: 'desc' },
    });
    return point;
  }

  private calculateDistance(p1: GPSPoint, p2: GPSPoint): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (p1.lat * Math.PI) / 180;
    const φ2 = (p2.lat * Math.PI) / 180;
    const Δφ = ((p2.lat - p1.lat) * Math.PI) / 180;
    const Δλ = ((p2.lng - p1.lng) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  private isPointInPolygon(point: GPSPoint, polygon: { lat: number; lng: number }[]): boolean {
    let inside = false;
    let j = polygon.length - 1;

    for (let i = 0; i < polygon.length; i++) {
      const pi = polygon[i];
      const pj = polygon[j];

      if (
        ((pi.lng > point.lng) !== (pj.lng > point.lng)) &&
        (point.lat < ((pj.lat - pi.lat) * (point.lng - pi.lng)) / (pj.lng - pi.lng) + pi.lat)
      ) {
        inside = !inside;
      }
      j = i;
    }

    return inside;
  }
}
