import { IsUUID, IsOptional, IsString, IsBoolean, IsEnum } from 'class-validator';
import { DispatchErrorType } from '@prisma/client';

export class AssignDriverDto {
  @IsUUID()
  driverId: string;

  @IsUUID()
  vehicleId: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsBoolean()
  isDispatchError?: boolean;

  @IsOptional()
  @IsEnum(DispatchErrorType)
  errorType?: DispatchErrorType;
}
