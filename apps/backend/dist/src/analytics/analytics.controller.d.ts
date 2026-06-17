import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getDashboardStats(): Promise<{
        activeTrips: number;
        pendingOrders: number;
        totalDrivers: number;
        availableVehicles: number;
        weightAlerts: number;
        delayedTrips: number;
        onTimeDelivery: number;
    }>;
}
