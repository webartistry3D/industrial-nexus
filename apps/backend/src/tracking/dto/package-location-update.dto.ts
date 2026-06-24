import { IsNumber, IsOptional, IsString } from 'class-validator';

export class PackageLocationUpdateDto {
  @IsString()
  packageTrackerId: string;

  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @IsOptional()
  @IsNumber()
  speed?: number;

  @IsOptional()
  @IsNumber()
  heading?: number;
}
