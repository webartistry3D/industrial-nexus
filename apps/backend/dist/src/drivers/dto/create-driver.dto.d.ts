import { KycStatus, DriverStatus, DriverAvailability } from '@prisma/client';
export declare class CreateDriverDto {
    userId: string;
    licenseNumber: string;
    kycStatus?: KycStatus;
    status?: DriverStatus;
    availability?: DriverAvailability;
    vehicleId?: string;
}
