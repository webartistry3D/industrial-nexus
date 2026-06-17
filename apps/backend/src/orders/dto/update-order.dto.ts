import { IsString, IsNumber, IsOptional, IsEnum, IsObject, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { Priority, HandlingTagType } from '@prisma/client';

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
  cargoDescription?: string;

  @IsOptional()
  @IsString()
  deliveryInstructions?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(HandlingTagType, { each: true })
  handlingTags?: HandlingTagType[];
}
