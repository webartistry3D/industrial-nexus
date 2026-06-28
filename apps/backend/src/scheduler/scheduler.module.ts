import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DocumentExpiryScheduler } from './document-expiry.scheduler';
import { SlaMonitorScheduler } from './sla-monitor.scheduler';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, forwardRef(() => NotificationsModule)],
  providers: [DocumentExpiryScheduler, SlaMonitorScheduler],
  exports: [DocumentExpiryScheduler, SlaMonitorScheduler],
})
export class SchedulerModule {}
