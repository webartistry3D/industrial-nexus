import { Controller, Get, Patch, Delete, Post, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { DocumentExpiryScheduler } from '../scheduler/document-expiry.scheduler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('notifications')
@ApiBearerAuth('access-token')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly documentExpiryScheduler: DocumentExpiryScheduler,
  ) {}

  @Get()
  async getMyNotifications(@Request() req: any) {
    return this.notificationsService.findAllForUser(req.user.userId);
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    return this.notificationsService.getUnreadCount(req.user.userId);
  }

  @Patch('mark-all-read')
  async markAllAsRead(@Request() req: any) {
    return this.notificationsService.markAllAsRead(req.user.userId);
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req: any) {
    return this.notificationsService.markAsRead(id, req.user.userId);
  }

  @Delete(':id')
  async deleteNotification(@Param('id') id: string, @Request() req: any) {
    return this.notificationsService.deleteNotification(id, req.user.userId);
  }

  @Post('trigger-expiry-check')
  async triggerExpiryCheck() {
    await this.documentExpiryScheduler.checkDocumentExpiries();
    return { success: true, message: 'Document expiry check triggered' };
  }
}
