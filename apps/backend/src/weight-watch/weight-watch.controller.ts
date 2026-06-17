import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { WeightWatchService, WeightValidationResult } from './weight-watch.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, HandlingTagType } from '@prisma/client';

class ValidateWeightDto {
  cargoWeight: number;
  vehicleId: string;
  handlingTags: HandlingTagType[];
}

@Controller('weight-watch')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WeightWatchController {
  constructor(private readonly weightWatchService: WeightWatchService) {}

  @Post('validate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  async validateWeight(@Body() validateDto: ValidateWeightDto): Promise<WeightValidationResult> {
    return this.weightWatchService.validateTripWeight(
      validateDto.cargoWeight,
      validateDto.vehicleId,
      validateDto.handlingTags,
    );
  }

  @Get('alerts')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  getWeightAlerts() {
    return this.weightWatchService.getWeightAlerts();
  }
}
