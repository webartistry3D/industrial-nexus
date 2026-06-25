import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './audit/audit.module';
import { OrdersModule } from './orders/orders.module';
import { KittingModule } from './kitting/kitting.module';
import { PackageTrackersModule } from './package-trackers/package-trackers.module';
import { DriversModule } from './drivers/drivers.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { TripsModule } from './trips/trips.module';
import { WeightWatchModule } from './weight-watch/weight-watch.module';
import { GeofencingModule } from './geofencing/geofencing.module';
import { RedisModule } from './redis/redis.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { TrackingModule } from './tracking/tracking.module';
import { SettingsModule } from './settings/settings.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SchedulerModule } from './scheduler/scheduler.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    AuditModule,
    OrdersModule,
    KittingModule,
    PackageTrackersModule,
    DriversModule,
    VehiclesModule,
    TripsModule,
    WeightWatchModule,
    GeofencingModule,
    AnalyticsModule,
    TrackingModule,
    SettingsModule,
    NotificationsModule,
    SchedulerModule,
  ],
})
export class AppModule {}
