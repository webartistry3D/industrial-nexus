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

    // Fetch user info for the notification
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { firstName: true, lastName: true },
    });

    const userName = user ? `${user.firstName} ${user.lastName}` : 'Unknown User';

    // Publish to Redis so the TrackingGateway can push it via WebSocket
    console.log(`[Notifications] Publishing to Redis for userId=${dto.userId}, type=${dto.type}`);
    await this.redis.publish(
      'notification:new',
      JSON.stringify({
        userId: dto.userId,
        notification: {
          id: notification.id,
          userId: dto.userId,
          userName,
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
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Fetch user info for all notifications
    const userIds = [...new Set(notifications.map(n => n.userId))];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true },
    });

    const userMap = new Map(users.map(u => [u.id, `${u.firstName} ${u.lastName}`]));

    return notifications.map(n => ({
      ...n,
      userName: userMap.get(n.userId) || 'Unknown User',
    }));
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
    return this.prisma.notification.deleteMany({
      where: { id, userId },
    });
  }

  // Convenience factory methods called from other services

  async notifyTripAssigned(driverUserId: string, clientUserId: string, orderNumber: string, tripId: string) {
    const driverUser = await this.prisma.user.findUnique({
      where: { id: driverUserId },
      select: { firstName: true, lastName: true },
    });
    const driverName = driverUser ? `${driverUser.firstName} ${driverUser.lastName}` : 'A driver';

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
        message: `${driverName} has been assigned to your order ${orderNumber}`,
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

  async notifyOrderSubmitted(adminUserIds: string[], orderNumber: string, orderId: string, clientUserId?: string) {
    const notifications: Promise<any>[] = adminUserIds.map(userId =>
      this.create({
        userId,
        type: NotificationType.ORDER_SUBMITTED,
        title: 'New Order Submitted',
        message: `Order ${orderNumber} has been submitted and requires approval`,
        entityId: orderId,
        entityType: 'ORDER',
      }),
    );

    if (clientUserId) {
      notifications.push(
        this.create({
          userId: clientUserId,
          type: NotificationType.ORDER_SUBMITTED,
          title: 'Order Submitted',
          message: `Your order ${orderNumber} has been submitted and is awaiting approval`,
          entityId: orderId,
          entityType: 'ORDER',
        }),
      );
    }

    await Promise.all(notifications);
  }

  async notifyOrderCreated(adminOpsUserIds: string[], orderNumber: string, orderId: string) {
    await Promise.all(
      adminOpsUserIds.map(userId =>
        this.create({
          userId,
          type: NotificationType.ORDER_SUBMITTED,
          title: 'New Order Created',
          message: `Order ${orderNumber} has been created and is awaiting review`,
          entityId: orderId,
          entityType: 'ORDER',
        }),
      ),
    );
  }

  async notifyOrderRejected(clientUserId: string, adminOpsUserIds: string[], orderNumber: string, orderId: string) {
    await Promise.all([
      this.create({
        userId: clientUserId,
        type: NotificationType.ORDER_REJECTED,
        title: 'Order Rejected',
        message: `Your order ${orderNumber} has been rejected`,
        entityId: orderId,
        entityType: 'ORDER',
      }),
      ...adminOpsUserIds.map(userId =>
        this.create({
          userId,
          type: NotificationType.ORDER_REJECTED,
          title: 'Order Rejected',
          message: `Order ${orderNumber} has been rejected`,
          entityId: orderId,
          entityType: 'ORDER',
        }),
      ),
    ]);
  }

  async notifyOrderApproved(clientUserId: string, opsUserIds: string[], orderNumber: string, orderId: string) {
    await Promise.all([
      this.create({
        userId: clientUserId,
        type: NotificationType.ORDER_APPROVED,
        title: 'Order Approved',
        message: `Your order ${orderNumber} has been approved and is being processed`,
        entityId: orderId,
        entityType: 'ORDER',
      }),
      ...opsUserIds.map(userId =>
        this.create({
          userId,
          type: NotificationType.ORDER_APPROVED,
          title: 'Order Approved',
          message: `Order ${orderNumber} has been approved — please begin kitting`,
          entityId: orderId,
          entityType: 'ORDER',
        }),
      ),
    ]);
  }

  async notifyOrderDispatchReady(adminOpsUserIds: string[], orderNumber: string, orderId: string, clientUserId?: string) {
    await Promise.all([
      ...adminOpsUserIds.map(userId =>
        this.create({
          userId,
          type: NotificationType.ORDER_STATUS_CHANGED,
          title: 'Order Ready for Dispatch',
          message: `Order ${orderNumber} has completed kitting and is ready for driver assignment`,
          entityId: orderId,
          entityType: 'ORDER',
        }),
      ),
      ...(clientUserId ? [this.create({
        userId: clientUserId,
        type: NotificationType.ORDER_STATUS_CHANGED,
        title: 'Order Ready for Dispatch',
        message: `Your order ${orderNumber} has completed kitting and is ready for dispatch`,
        entityId: orderId,
        entityType: 'ORDER',
      })] : []),
    ]);
  }

  async notifyDriverAssigned(
    driverUserId: string,
    clientUserId: string,
    adminOpsUserIds: string[],
    orderNumber: string,
    orderId: string,
    tripId?: string,
  ) {
    console.log(`[Notifications] notifyDriverAssigned: driverUserId=${driverUserId}, clientUserId=${clientUserId}, adminOpsCount=${adminOpsUserIds.length}, tripId=${tripId}`);

    const driverUser = await this.prisma.user.findUnique({
      where: { id: driverUserId },
      select: { firstName: true, lastName: true },
    });
    const driverName = driverUser ? `${driverUser.firstName} ${driverUser.lastName}` : 'A driver';

    await Promise.all([
      this.create({
        userId: clientUserId,
        type: NotificationType.TRIP_ASSIGNED,
        title: 'Driver Assigned',
        message: `${driverName} has been assigned to your order ${orderNumber}`,
        entityId: orderId,
        entityType: 'ORDER',
      }),
      this.create({
        userId: driverUserId,
        type: NotificationType.TRIP_ASSIGNED,
        title: 'New Trip Assigned',
        message: `You have been assigned to order ${orderNumber}`,
        entityId: tripId || orderId,
        entityType: tripId ? 'TRIP' : 'ORDER',
      }),
      ...adminOpsUserIds.map(userId =>
        this.create({
          userId,
          type: NotificationType.TRIP_ASSIGNED,
          title: 'Driver Assigned',
          message: `${driverName} has been assigned to order ${orderNumber}`,
          entityId: orderId,
          entityType: 'ORDER',
        }),
      ),
    ]);
  }
}
