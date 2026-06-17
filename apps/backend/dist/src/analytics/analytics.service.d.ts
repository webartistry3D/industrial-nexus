import { PrismaService } from '../prisma/prisma.service';
export declare class AnalyticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
