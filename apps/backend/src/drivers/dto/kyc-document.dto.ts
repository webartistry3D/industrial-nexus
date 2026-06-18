import { IsString, IsEnum, IsOptional, IsUUID, IsInt, Max } from 'class-validator';
import { KycDocumentType, KycDocumentStatus } from '@prisma/client';

export class CreateKycDocumentDto {
  @IsEnum(KycDocumentType)
  documentType: KycDocumentType;

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

export class UpdateKycDocumentDto {
  @IsOptional()
  @IsEnum(KycDocumentStatus)
  status?: KycDocumentStatus;

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  expiresAt?: Date;
}

export class KycDocumentFilterDto {
  @IsOptional()
  @IsEnum(KycDocumentStatus)
  status?: KycDocumentStatus;

  @IsOptional()
  @IsEnum(KycDocumentType)
  documentType?: KycDocumentType;

  @IsOptional()
  @IsUUID()
  driverId?: string;
}
