import { VehicleStatus, VehicleCategory } from '@prisma/client';
export declare class VehicleFilterDto {
    page?: number;
    limit?: number;
    status?: VehicleStatus;
    category?: VehicleCategory;
    search?: string;
}
