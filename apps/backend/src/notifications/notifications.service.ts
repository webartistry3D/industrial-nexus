import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async create(dto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        entityId: dto.entityId,
        entityType: dto.entityType,
      },
    });

    // Publish to Redis so the TrackingGateway can push it via WebSocket
    await this.redis.publish(
      'notification:new',
      JSON.stringify({
        userId: dto.userId,
        notification: {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          entityId: notification.entityId,
          entityType: notification.entityType,
          isRead: notification.isRead,
          createdAt: notification.createdAt,
        },
      }),
    );

    return notification;
  }

  async findAllForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { success: true };
  }

  async deleteNotification(id: string, userId: string) {
    return this.prisma.notification.delete({
      where: { id },
    });
  }

  // Convenience factory methods called from other services

  async notifyTripAssigned(driverUserId: string, clientUserId: string, orderNumber: string, tripId: string) {
    await Promise.all([
      this.create({
        userId: driverUserId,
        type: NotificationType.TRIP_ASSIGNED,
        title: 'New Trip Assigned',
        message: `You have been assigned to trip for order ${orderNumber}`,
        entityId: tripId,
        entityType: 'TRIP',
      }),
      this.create({
        userId: clientUserId,
        type: NotificationType.TRIP_ASSIGNED,
        title: 'Driver Assigned',
        message: `A driver has been assigned to your order ${orderNumber}`,
        entityId: tripId,
        entityType: 'TRIP',
      }),
    ]);
  }

  async notifyTripStarted(driverUserId: string, clientUserId: string, orderNumber: string, tripId: string) {
    await Promise.all([
      this.create({
        userId: clientUserId,
        type: NotificationType.TRIP_STARTED,
        title: 'Trip Started',
        message: `Your order ${orderNumber} is now in transit`,
        entityId: tripId,
        entityType: 'TRIP',
      }),
      this.create({
        userId: driverUserId,
        type: NotificationType.TRIP_STARTED,
        title: 'Trip Started',
        message: `Trip for order ${orderNumber} has started`,
        entityId: tripId,
        entityType: 'TRIP',
      }),
    ]);
  }

  async notifyTripCompleted(driverUserId: string, clientUserId: string, orderNumber: string, tripId: string) {
    await Promise.all([
      this.create({
        userId: clientUserId,
        type: NotificationType.TRIP_COMPLETED,
        title: 'Order Delivered',
        message: `Your order ${orderNumber} has been delivered`,
        entityId: tripId,
        entityType: 'TRIP',
      }),
      this.create({
        userId: driverUserId,
        type: NotificationType.TRIP_COMPLETED,
        title: 'Trip Completed',
        message: `Trip for order ${orderNumber} has been completed`,
        entityId: tripId,
        entityType: 'TRIP',
      }),
    ]);
  }

  async notifyOrderStatusChanged(clientUserId: string, orderNumber: string, orderId: string, newStatus: string) {
    await this.create({
      userId: clientUserId,
      type: NotificationType.ORDER_STATUS_CHANGED,
      title: 'Order Status Updated',
      message: `Order ${orderNumber} status changed to ${newStatus.replace(/_/g, ' ')}`,
      entityId: orderId,
      entityType: 'ORDER',
    });
  }

  async notifyOrderSubmitted(adminUserIds: string[], orderNumber: string, orderId: string) {
    await Promise.all(
      adminUserIds.map(userId =>
        this.create({
          userId,
          type: NotificationType.ORDER_SUBMITTED,
          title: 'New Order Submitted',
          message: `Order ${orderNumber} has been submitted and requires approval`,
          entityId: orderId,
          entityType: 'ORDER',
        }),
      ),
    );
  }
}
