import { IsOptional } from 'class-validator';

export class RouteQueryDto {
  @IsOptional()
  includeTrackingHistory?: boolean;
}
