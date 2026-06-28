import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GeocodingService } from './geocoding.service';
import { ValhallaService } from './valhalla.service';

@ApiTags('maps')
@ApiBearerAuth('access-token')
@Controller('maps')
@UseGuards(JwtAuthGuard)
export class MapsController {
  constructor(
    private readonly geocoding: GeocodingService,
    private readonly valhalla: ValhallaService,
  ) {}

  @Get('geocode')
  async geocode(@Query('q') query: string, @Query('country') country = 'ng') {
    return this.geocoding.search(query, country);
  }

  @Get('reverse-geocode')
  async reverseGeocode(@Query('lat') lat: string, @Query('lng') lng: string) {
    return this.geocoding.reverse(parseFloat(lat), parseFloat(lng));
  }

  @Get('route')
  async route(
    @Query('originLat') originLat: string,
    @Query('originLng') originLng: string,
    @Query('destLat') destLat: string,
    @Query('destLng') destLng: string,
  ) {
    return this.valhalla.getRoute(
      { lat: parseFloat(originLat), lng: parseFloat(originLng) },
      { lat: parseFloat(destLat), lng: parseFloat(destLng) },
    );
  }
}
