import { Controller, Get, Patch, Body, UseGuards, Post, Put, Delete, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { CreateHandlingTagDto, UpdateHandlingTagDto } from './dto/handling-tag.dto';
import { UserRole } from '@prisma/client';

@ApiTags('settings')
@ApiBearerAuth('access-token')
@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Patch()
  @Roles(UserRole.SUPER_ADMIN)
  updateSettings(@Body() updateSettingsDto: UpdateSettingsDto) {
    return this.settingsService.updateSettings(updateSettingsDto);
  }

  @Patch('batch')
  @Roles(UserRole.SUPER_ADMIN)
  updateBatchSettings(@Body() settings: any) {
    return this.settingsService.updateSettings(settings);
  }

  // Handling Tag Management endpoints
  @Get('handling-tags')
  getAllHandlingTags() {
    return this.settingsService.getAllHandlingTags();
  }

  @Post('handling-tags')
  @Roles(UserRole.SUPER_ADMIN)
  createHandlingTag(@Body() createTagDto: CreateHandlingTagDto) {
    return this.settingsService.createHandlingTag(createTagDto);
  }

  @Put('handling-tags/:id')
  @Roles(UserRole.SUPER_ADMIN)
  updateHandlingTag(@Param('id') id: string, @Body() updateTagDto: UpdateHandlingTagDto) {
    return this.settingsService.updateHandlingTag(id, updateTagDto);
  }

  @Delete('handling-tags/:id')
  @Roles(UserRole.SUPER_ADMIN)
  deleteHandlingTag(@Param('id') id: string) {
    return this.settingsService.deleteHandlingTag(id);
  }
}
