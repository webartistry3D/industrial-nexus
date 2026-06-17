import { DriverStatus, DriverAvailability, KycStatus } from '@prisma/client';
export declare class DriverFilterDto {
    page?: number;
    limit?: number;
    status?: DriverStatus;
    availability?: DriverAvailability;
    kycStatus?: KycStatus;
    search?: string;
}
