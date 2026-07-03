import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
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
import { MapsModule } from './maps/maps.module';
import { MailModule } from './mail/mail.module';
import { StorageModule } from './storage/storage.module';
import { BillingModule } from './billing/billing.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      { ttl: 60000, limit: 100 },
    ]),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    AuditModule,
    OrdersModule,
    BillingModule,
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
    MapsModule,
    MailModule,
    StorageModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
