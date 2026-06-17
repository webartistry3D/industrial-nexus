import { GeofencingService } from './geofencing.service';
declare class GPSUpdateDto {
    lat: number;
    lng: number;
    accuracy?: number;
}
export declare class GeofencingController {
    private readonly geofencingService;
    constructor(geofencingService: GeofencingService);
    processGPSUpdate(tripId: string, gpsUpdate: GPSUpdateDto): Promise<{
        processed: boolean;
        reason: string;
        geofenceEvents?: undefined;
    } | {
        processed: boolean;
        geofenceEvents: import(".prisma/client").$Enums.GeofenceEventType[];
        reason?: undefined;
    }>;
}
export {};
