import { VehicleCategory, VehicleStatus } from '@prisma/client';
export declare class UpdateVehicleDto {
    plateNumber?: string;
    category?: VehicleCategory;
    capacityKg?: number;
    status?: VehicleStatus;
    isPartitioned?: boolean;
}
