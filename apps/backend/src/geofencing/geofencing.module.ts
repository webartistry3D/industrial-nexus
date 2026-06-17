import { Module } from '@nestjs/common';
import { GeofencingService } from './geofencing.service';
import { GeofencingController } from './geofencing.controller';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [RedisModule],
  controllers: [GeofencingController],
  providers: [GeofencingService],
  exports: [GeofencingService],
})
export class GeofencingModule {}
