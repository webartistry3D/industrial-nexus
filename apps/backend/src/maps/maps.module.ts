import { Module } from '@nestjs/common';
import { ValhallaService } from './valhalla.service';
import { GeocodingService } from './geocoding.service';
import { MapsController } from './maps.controller';

@Module({
  controllers: [MapsController],
  providers: [ValhallaService, GeocodingService],
  exports: [ValhallaService, GeocodingService],
})
export class MapsModule {}
