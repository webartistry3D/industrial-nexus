import { IsString, IsNumber, IsOptional, IsEnum, IsObject, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { Priority, HandlingTagType } from '@prisma/client';

export class LocationDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsString()
  address: string;

  [key: string]: any;
}

export class CreateOrderDto {
  @IsOptional()
  @IsString()
  clientId?: string;

  @IsNumber()
  @Type(() => Number)
  totalWeight: number;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto)
  pickupLocation: LocationDto;

  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto)
  deliveryLocation: LocationDto;

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
