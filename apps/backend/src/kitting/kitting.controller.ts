import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { KittingService } from './kitting.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, KittingStage } from '@prisma/client';

class StartKittingDto {
  orderId: string;
}

class ProgressKittingDto {
  stage: KittingStage;
  barcodeVerified?: boolean;
  notes?: string;
}

class VerifyBarcodeDto {
  barcode: string;
}

@Controller('kitting')
@UseGuards(JwtAuthGuard, RolesGuard)
export class KittingController {
  constructor(private readonly kittingService: KittingService) {}

  @Post('start')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  @HttpCode(HttpStatus.CREATED)
  startKitting(
    @Body() dto: StartKittingDto,
    @CurrentUser() user: { userId: string; role: UserRole },
  ) {
    return this.kittingService.startKitting(dto.orderId, user.userId);
  }

  @Post(':orderId/progress')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  progressKitting(
    @Param('orderId') orderId: string,
    @Body() dto: ProgressKittingDto,
    @CurrentUser() user: { userId: string; role: UserRole },
  ) {
    return this.kittingService.progressKitting(orderId, user.userId, dto);
  }

  @Post(':orderId/complete')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  @HttpCode(HttpStatus.OK)
  completeKitting(
    @Param('orderId') orderId: string,
    @CurrentUser() user: { userId: string; role: UserRole },
  ) {
    return this.kittingService.completeKitting(orderId, user.userId);
  }

  @Get(':orderId/logs')
  getKittingLogs(@Param('orderId') orderId: string) {
    return this.kittingService.getKittingLogs(orderId);
  }

  @Post(':orderId/verify-barcode')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  verifyBarcode(
    @Param('orderId') orderId: string,
    @Body() dto: VerifyBarcodeDto,
    @CurrentUser() user: { userId: string; role: UserRole },
  ) {
    return this.kittingService.verifyBarcode(orderId, user.userId, dto.barcode);
  }
}
