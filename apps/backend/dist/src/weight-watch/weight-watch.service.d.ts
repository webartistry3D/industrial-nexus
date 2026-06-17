import { PrismaService } from '../prisma/prisma.service';
import { WeightStatus, HandlingTagType } from '@prisma/client';
export interface WeightValidationResult {
    canAssign: boolean;
    reason?: string;
    utilization: number;
    status: WeightStatus;
    cargoCompatibility: 'COMPATIBLE' | 'INCOMPATIBLE';
    requiresPartitionedVehicle: boolean;
}
export declare class WeightWatchService {
    private prisma;
    constructor(prisma: PrismaService);
    validateTripWeight(cargoWeight: number, vehicleId: string, handlingTags: HandlingTagType[]): Promise<WeightValidationResult>;
    createWeightRecord(tripId: string, orderId: string, cargoWeight: number, vehicleCapacity: number): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.WeightStatus;
        orderId: string | null;
        cargoWeight: number;
        vehicleCapacity: number | null;
        utilization: number;
        checkedAt: Date;
        tripId: string | null;
    }>;
    getWeightAlerts(): Promise<({
        trip: {
            driver: {
                user: {
                    firstName: string;
                    lastName: string;
                };
            } & {
                id: string;
                status: import(".prisma/client").$Enums.DriverStatus;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                licenseNumber: string;
                kycStatus: import(".prisma/client").$Enums.KycStatus;
                availability: import(".prisma/client").$Enums.DriverAvailability;
                vehicleId: string | null;
            };
            vehicle: {
                id: string;
                status: import(".prisma/client").$Enums.VehicleStatus;
                createdAt: Date;
                updatedAt: Date;
                plateNumber: string;
                category: import(".prisma/client").$Enums.VehicleCategory;
                capacityKg: number;
                isPartitioned: boolean;
            };
            order: {
                orderNumber: string;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.TripStatus;
            createdAt: Date;
            updatedAt: Date;
            vehicleId: string;
            startedAt: Date | null;
            completedAt: Date | null;
            eta: Date | null;
            orderId: string;
            driverId: string;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.WeightStatus;
        orderId: string | null;
        cargoWeight: number;
        vehicleCapacity: number | null;
        utilization: number;
        checkedAt: Date;
        tripId: string | null;
    })[]>;
    private checkCargoCompatibility;
    private requiresPartitionedVehicle;
}
