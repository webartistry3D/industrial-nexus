import { Module } from '@nestjs/common';
import { WeightWatchService } from './weight-watch.service';
import { WeightWatchController } from './weight-watch.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [WeightWatchController],
  providers: [WeightWatchService],
  exports: [WeightWatchService],
})
export class WeightWatchModule {}
