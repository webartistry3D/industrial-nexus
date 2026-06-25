import { IsString, IsEnum, IsOptional, IsUUID, IsInt, Max } from 'class-validator';
import { VehicleDocumentType, VehicleDocumentStatus } from '@prisma/client';

export class CreateVehicleDocumentDto {
  @IsEnum(VehicleDocumentType)
  documentType: VehicleDocumentType;

  @IsString()
  fileUrl: string;

  @IsString()
  fileName: string;

  @IsInt()
  @Max(10485760) // 10MB max
  fileSize: number;

  @IsString()
  mimeType: string;

  @IsOptional()
  expiresAt?: Date;
}

export class UpdateVehicleDocumentDto {
  @IsOptional()
  @IsEnum(VehicleDocumentStatus)
  status?: VehicleDocumentStatus;

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  expiresAt?: Date;
}

export class VehicleDocumentFilterDto {
  @IsOptional()
  @IsEnum(VehicleDocumentStatus)
  status?: VehicleDocumentStatus;

  @IsOptional()
  @IsEnum(VehicleDocumentType)
  documentType?: VehicleDocumentType;

  @IsOptional()
  @IsUUID()
  vehicleId?: string;
}
