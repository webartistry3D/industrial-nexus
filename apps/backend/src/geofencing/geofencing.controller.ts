import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GeofencingService } from './geofencing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

class GPSUpdateDto {
  lat: number;
  lng: number;
  accuracy?: number;
}

@ApiTags('geofencing')
@ApiBearerAuth('access-token')
@Controller('geofencing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GeofencingController {
  constructor(private readonly geofencingService: GeofencingService) {}

  @Post('trips/:tripId/gps')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS, UserRole.DRIVER)
  async processGPSUpdate(
    @Param('tripId') tripId: string,
    @Body() gpsUpdate: GPSUpdateDto,
  ) {
    return this.geofencingService.processGPSUpdate(tripId, gpsUpdate);
  }
}
