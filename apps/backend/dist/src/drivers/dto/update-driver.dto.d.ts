import { KycStatus, DriverStatus, DriverAvailability } from '@prisma/client';
export declare class UpdateDriverDto {
    licenseNumber?: string;
    kycStatus?: KycStatus;
    status?: DriverStatus;
    availability?: DriverAvailability;
    vehicleId?: string;
}
