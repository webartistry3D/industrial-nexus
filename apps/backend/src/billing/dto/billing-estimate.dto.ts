import { IsNumber, IsEnum, IsArray, IsString, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Priority } from '@prisma/client';

export class BillingEstimateDto {
  @IsNumber()
  @Type(() => Number)
  pickupLat: number;

  @IsNumber()
  @Type(() => Number)
  pickupLng: number;

  @IsNumber()
  @Type(() => Number)
  deliveryLat: number;

  @IsNumber()
  @Type(() => Number)
  deliveryLng: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  totalWeight: number;

  @IsEnum(Priority)
  priority: Priority;

  @IsArray()
  @IsString({ each: true })
  handlingTags: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  declaredCargoValue?: number;
}
