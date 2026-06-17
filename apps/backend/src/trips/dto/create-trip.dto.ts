import { IsUUID, IsString, IsOptional } from 'class-validator';

export class CreateTripDto {
  @IsUUID()
  orderId: string;

  @IsUUID()
  driverId: string;

  @IsUUID()
  vehicleId: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
