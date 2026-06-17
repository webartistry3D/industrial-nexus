import { Module } from '@nestjs/common';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';
import { AuditModule } from '../audit/audit.module';
import { WeightWatchModule } from '../weight-watch/weight-watch.module';

@Module({
  imports: [AuditModule, WeightWatchModule],
  controllers: [TripsController],
  providers: [TripsService],
  exports: [TripsService],
})
export class TripsModule {}
