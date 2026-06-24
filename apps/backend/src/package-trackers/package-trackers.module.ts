import { Module } from '@nestjs/common';
import { PackageTrackersService } from './package-trackers.service';
import { PackageTrackersController } from './package-trackers.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [PackageTrackersController],
  providers: [PackageTrackersService],
  exports: [PackageTrackersService],
})
export class PackageTrackersModule {}
