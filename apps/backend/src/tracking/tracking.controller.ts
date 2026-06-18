import { Controller, Get, Param, Query, UseGuards, Post, Body } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { LiveTrackingQueryDto, FleetTrackingQueryDto } from './dto/live-tracking.dto';
import { RouteQueryDto } from './dto/route-query.dto';
import { LocationUpdateDto } from './dto/location-update.dto';

@Controller('tracking')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Get('trips/:tripId/live')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS, UserRole.CLIENT)
  async getLiveTripLocation(@Param('tripId') tripId: string) {
    return this.trackingService.getLiveTripLocation(tripId);
  }

  @Get('trips/:tripId/history')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS, UserRole.CLIENT, UserRole.DRIVER)
  async getTripTrackingHistory(
    @Param('tripId') tripId: string,
    @Query() query: LiveTrackingQueryDto,
  ) {
    return this.trackingService.getTripTrackingHistory(tripId, query.limit);
  }

  @Get('fleet/active')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  async getActiveFleetLocations(@Query() query: FleetTrackingQueryDto) {
    const locations = await this.trackingService.getAllActiveTripsLocations();
    if (query.status) {
      return locations.filter(l => l.trip.status === query.status);
    }
    return locations;
  }

  @Get('geofences')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  async getGeofenceZones() {
    return this.trackingService.getGeofenceZones();
  }

  @Get('trips/:tripId/route')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS, UserRole.CLIENT, UserRole.DRIVER)
  async getTripRoute(@Param('tripId') tripId: string, @Query() query: RouteQueryDto) {
    return this.trackingService.calculateRoute(tripId);
  }

  @Post('trips/:tripId/location')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS, UserRole.DRIVER)
  async updateLocation(
    @Param('tripId') tripId: string,
    @Body() locationUpdate: LocationUpdateDto,
  ) {
    return this.trackingService.processLocationUpdate(
      tripId,
      locationUpdate.lat,
      locationUpdate.lng,
      locationUpdate.accuracy,
    );
  }
}
