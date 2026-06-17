import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { VehicleCategory, VehicleStatus } from '@prisma/client';

export class CreateVehicleDto {
  @IsString()
  plateNumber: string;

  @IsEnum(VehicleCategory)
  category: VehicleCategory;

  @IsNumber()
  capacityKg: number;

  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

  @IsOptional()
  @IsBoolean()
  isPartitioned?: boolean;
}
