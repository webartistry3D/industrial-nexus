import { Module } from '@nestjs/common';
import { KittingService } from './kitting.service';
import { KittingController } from './kitting.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [KittingController],
  providers: [KittingService],
  exports: [KittingService],
})
export class KittingModule {}
