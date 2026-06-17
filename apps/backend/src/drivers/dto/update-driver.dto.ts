import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { KycStatus, DriverStatus, DriverAvailability } from '@prisma/client';

export class UpdateDriverDto {
  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsEnum(KycStatus)
  kycStatus?: KycStatus;

  @IsOptional()
  @IsEnum(DriverStatus)
  status?: DriverStatus;

  @IsOptional()
  @IsEnum(DriverAvailability)
  availability?: DriverAvailability;

  @IsOptional()
  @IsUUID()
  vehicleId?: string;
}
