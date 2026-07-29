import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('analytics')
@ApiBearerAuth('access-token')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  async getDashboardStats() {
    return this.analyticsService.getDashboardStats();
  }

  @Get('drivers')
  async getDriverPerformance() {
    return this.analyticsService.getDriverPerformance();
  }

  @Get('trends')
  async getDeliveryTrends(@Query('days') days?: string) {
    return this.analyticsService.getDeliveryTrends(days ? parseInt(days, 10) : 30);
  }

  @Get('smart-kpis')
  async getSmartKpis() {
    return this.analyticsService.getSmartKpis();
  }
}
