import { IsString, IsNumber, IsOptional, IsEnum, IsObject, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Sanitize } from '../../common/decorators/sanitize.decorator';
import { Priority } from '@prisma/client';

export class LocationDto {
  @ApiProperty({ example: 6.5244 })
  @IsNumber()
  lat: number;

  @ApiProperty({ example: 3.3792 })
  @IsNumber()
  lng: number;

  @ApiProperty({ example: '15 Eko Street, Lagos' })
  @IsString()
  address: string;

  [key: string]: any;
}

export class CreateOrderDto {
  @ApiPropertyOptional({ description: 'Client user ID' })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiProperty({ example: 500, description: 'Total cargo weight in kg' })
  @IsNumber()
  @Type(() => Number)
  totalWeight: number;

  @ApiPropertyOptional({ enum: Priority, default: Priority.NORMAL })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiProperty({ type: LocationDto })
  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto)
  pickupLocation: LocationDto;

  @ApiProperty({ type: LocationDto })
  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto)
  deliveryLocation: LocationDto;

  @ApiPropertyOptional({ example: 'Fragile electronics' })
  @IsOptional()
  @IsString()
  @Sanitize()
  cargoDescription?: string;

  @ApiPropertyOptional({ example: 'Ring doorbell twice' })
  @IsOptional()
  @IsString()
  @Sanitize()
  deliveryInstructions?: string;

  @ApiPropertyOptional({ example: ['FRAGILE', 'KEEP_COOL'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  handlingTags?: string[];
}
