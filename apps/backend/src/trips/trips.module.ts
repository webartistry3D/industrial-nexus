import { Module } from '@nestjs/common';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { AuditModule } from '../audit/audit.module';
import { WeightWatchModule } from '../weight-watch/weight-watch.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MapsModule } from '../maps/maps.module';

@Module({
  imports: [AuditModule, WeightWatchModule, NotificationsModule, MapsModule],
  controllers: [TripsController],
  providers: [TripsService],
  exports: [TripsService],
})
export class TripsModule {}
