import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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
}
