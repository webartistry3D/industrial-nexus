import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
interface GPSPoint {
    lat: number;
    lng: number;
    accuracy?: number;
}
export declare class GeofencingService {
    private prisma;
    private redis;
    private readonly COOLDOWN_SECONDS;
    private readonly MIN_MOVEMENT_THRESHOLD;
    constructor(prisma: PrismaService, redis: RedisService);
    processGPSUpdate(tripId: string, point: GPSPoint): Promise<{
        processed: boolean;
        reason: string;
        geofenceEvents?: undefined;
    } | {
        processed: boolean;
        geofenceEvents: import(".prisma/client").$Enums.GeofenceEventType[];
        reason?: undefined;
    }>;
    private checkGeofences;
    private emitGeofenceEvent;
    private getLastGPSPoint;
    private storeGPSPoint;
    private calculateDistance;
    private isPointInPolygon;
}
export {};
