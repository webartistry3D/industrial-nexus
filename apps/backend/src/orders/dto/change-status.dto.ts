import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Sanitize } from '../../common/decorators/sanitize.decorator';
import { OrderStatus } from '@prisma/client';

export class ChangeStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsOptional()
  @IsString()
  @Sanitize()
  notes?: string;

  @IsOptional()
  @IsString()
  driverId?: string;

  @IsOptional()
  @IsString()
  vehicleId?: string;
}
