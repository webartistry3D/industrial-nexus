import { IsOptional } from 'class-validator';

export class LiveTrackingQueryDto {
  @IsOptional()
  limit?: number;
}

export class FleetTrackingQueryDto {
  @IsOptional()
  status?: string;
}
