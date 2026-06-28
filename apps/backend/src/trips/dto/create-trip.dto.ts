import { IsUUID, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Sanitize } from '../../common/decorators/sanitize.decorator';

export class CreateTripDto {
  @ApiProperty({ description: 'Order ID to dispatch' })
  @IsUUID()
  orderId: string;

  @ApiProperty({ description: 'Assigned driver ID' })
  @IsUUID()
  driverId: string;

  @ApiProperty({ description: 'Assigned vehicle ID' })
  @IsUUID()
  vehicleId: string;

  @ApiPropertyOptional({ example: 'Handle with care' })
  @IsOptional()
  @IsString()
  @Sanitize()
  notes?: string;
}
