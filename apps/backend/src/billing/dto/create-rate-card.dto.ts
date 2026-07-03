import {
  IsString,
  IsNumber,
  IsObject,
  Min,
  Max,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class PriorityMultipliersDto {
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  LOW: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  NORMAL: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  HIGH: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  URGENT: number;
}

export class CreateRateCardDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  baseRatePerKm: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  baseRatePerKg: number;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minimumCharge: number;

  @IsObject()
  @ValidateNested()
  @Type(() => PriorityMultipliersDto)
  priorityMultipliers: PriorityMultipliersDto;

  @IsNumber()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  heavySurcharge: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  fragileSurcharge: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  hazardousSurcharge: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  chemicalSurcharge: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  temperatureSensitiveSurcharge: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  verticalStorageSurcharge: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  insuranceRatePercent: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  vatPercent: number;
}
