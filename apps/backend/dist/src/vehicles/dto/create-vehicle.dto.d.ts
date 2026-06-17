import { VehicleCategory, VehicleStatus } from '@prisma/client';
export declare class CreateVehicleDto {
    plateNumber: string;
    category: VehicleCategory;
    capacityKg: number;
    status?: VehicleStatus;
    isPartitioned?: boolean;
}
