import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { VehicleCategory, VehicleStatus } from '@prisma/client';

export class UpdateVehicleDto {
  @IsOptional()
  @IsString()
  plateNumber?: string;

  @IsOptional()
  @IsEnum(VehicleCategory)
  category?: VehicleCategory;

  @IsOptional()
  @IsNumber()
  capacityKg?: number;

  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

  @IsOptional()
  @IsBoolean()
  isPartitioned?: boolean;
}
