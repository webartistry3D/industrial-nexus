import { IsString, IsNumber, IsOptional, IsEnum, IsObject, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { Sanitize } from '../../common/decorators/sanitize.decorator';
import { Priority } from '@prisma/client';

class LocationDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsString()
  address: string;
}

export class UpdateOrderDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  totalWeight?: number;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto)
  pickupLocation?: LocationDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto)
  deliveryLocation?: LocationDto;

  @IsOptional()
  @IsString()
  @Sanitize()
  cargoDescription?: string;

  @IsOptional()
  @IsString()
  @Sanitize()
  deliveryInstructions?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  handlingTags?: string[];
}
