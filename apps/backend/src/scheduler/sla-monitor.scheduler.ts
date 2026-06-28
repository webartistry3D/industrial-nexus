import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

const SLA_WINDOW_HOURS = 12;
const LATE_RISK_THRESHOLD_HOURS = 10;
const STATIONARY_THRESHOLD_MINUTES = 20;
const ALERT_COOLDOWN_MINUTES = 30;

@Injectable()
export class SlaMonitorScheduler {
  private readonly logger = new Logger(SlaMonitorScheduler.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  @Cron('*/5 * * * *')
  async runSlaChecks() {
    this.logger.debug('[SLA] Running SLA checks...');
    await Promise.all([
      this.checkLateRisk(),
      this.checkStationaryVehicles(),
    ]);
  }

  private async checkLateRisk() {
    const lateRiskCutoff = new Date(Date.now() - LATE_RISK_THRESHOLD_HOURS * 60 * 60 * 1000);

    const atRiskTrips = await this.prisma.trip.findMany({
      where: {
        status: 'IN_TRANSIT',
        startedAt: { lte: lateRiskCutoff },
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            clientId: true,
          },
        },
        driver: {
          select: { userId: true },
        },
      },
    });

    for (const trip of atRiskTrips) {
      const alreadyAlerted = await this.hasSentRecentAlert(
        trip.driver.userId,
        trip.id,
        NotificationType.LATE_RISK,
        ALERT_COOLDOWN_MINUTES,
      );
      if (alreadyAlerted) continue;

      const hoursElapsed = Math.floor(
        (Date.now() - trip.startedAt!.getTime()) / (1000 * 60 * 60),
      );
      const hoursRemaining = SLA_WINDOW_HOURS - hoursElapsed;

      const ops = await this.getOpsUserIds();

      const notifications = [
        this.notificationsService.create({
          userId: trip.driver.userId,
          type: NotificationType.LATE_RISK,
          title: 'SLA Late Risk — Action Required',
          message: `Trip for order ${trip.order.orderNumber} has been in transit for ${hoursElapsed}h. ${hoursRemaining > 0 ? `${hoursRemaining}h remaining in the 12h SLA window.` : 'SLA window has been exceeded.'}`,
          entityId: trip.id,
          entityType: 'TRIP',
        }),
        this.notificationsService.create({
          userId: trip.order.clientId,
          type: NotificationType.LATE_RISK,
          title: 'Delivery Delay Risk',
          message: `Your order ${trip.order.orderNumber} may be delayed. ${hoursRemaining > 0 ? `${hoursRemaining}h remaining in the expected delivery window.` : 'The expected delivery window has been exceeded.'}`,
          entityId: trip.id,
          entityType: 'TRIP',
        }),
        ...ops.map(userId =>
          this.notificationsService.create({
            userId,
            type: NotificationType.LATE_RISK,
            title: `Late Risk: Order ${trip.order.orderNumber}`,
            message: `Trip ${trip.id.slice(-6).toUpperCase()} has been in transit for ${hoursElapsed}h. ${hoursRemaining > 0 ? `${hoursRemaining}h to SLA breach.` : 'SLA window breached — immediate intervention required.'}`,
            entityId: trip.id,
            entityType: 'TRIP',
          }),
        ),
      ];

      await Promise.all(notifications);
      this.logger.warn(`[SLA] Late risk alert sent for trip ${trip.id} (${hoursElapsed}h elapsed)`);
    }
  }

  private async checkStationaryVehicles() {
    const stationaryCutoff = new Date(Date.now() - STATIONARY_THRESHOLD_MINUTES * 60 * 1000);

    const activeTrips = await this.prisma.trip.findMany({
      where: { status: 'IN_TRANSIT' },
      include: {
        order: { select: { orderNumber: true, clientId: true } },
        driver: { select: { userId: true } },
      },
    });

    for (const trip of activeTrips) {
      const lastPoint = await this.prisma.trackingPoint.findFirst({
        where: { tripId: trip.id },
        orderBy: { timestamp: 'desc' },
      });

      if (!lastPoint) continue;
      if (lastPoint.timestamp > stationaryCutoff) continue;

      const alreadyAlerted = await this.hasSentRecentAlert(
        trip.driver.userId,
        trip.id,
        NotificationType.STATIONARY_ALERT,
        ALERT_COOLDOWN_MINUTES,
      );
      if (alreadyAlerted) continue;

      const minutesStationary = Math.floor(
        (Date.now() - lastPoint.timestamp.getTime()) / (1000 * 60),
      );

      const ops = await this.getOpsUserIds();

      const notifications = [
        this.notificationsService.create({
          userId: trip.driver.userId,
          type: NotificationType.STATIONARY_ALERT,
          title: 'Vehicle Stationary Alert',
          message: `No movement detected for your trip (order ${trip.order.orderNumber}) in the last ${minutesStationary} minutes. Please update your status or contact operations.`,
          entityId: trip.id,
          entityType: 'TRIP',
        }),
        ...ops.map(userId =>
          this.notificationsService.create({
            userId,
            type: NotificationType.STATIONARY_ALERT,
            title: `Stationary Vehicle: Order ${trip.order.orderNumber}`,
            message: `Trip ${trip.id.slice(-6).toUpperCase()} has had no GPS movement for ${minutesStationary} minutes. Last seen at (${lastPoint.lat.toFixed(4)}, ${lastPoint.lng.toFixed(4)}).`,
            entityId: trip.id,
            entityType: 'TRIP',
          }),
        ),
      ];

      await Promise.all(notifications);
      this.logger.warn(`[SLA] Stationary alert sent for trip ${trip.id} (${minutesStationary} min stationary)`);
    }
  }

  private async getOpsUserIds(): Promise<string[]> {
    const ops = await this.prisma.user.findMany({
      where: {
        role: { in: ['SUPER_ADMIN', 'OPERATIONS'] },
        status: 'ACTIVE',
      },
      select: { id: true },
    });
    return ops.map(u => u.id);
  }

  private async hasSentRecentAlert(
    userId: string,
    tripId: string,
    type: NotificationType,
    withinMinutes: number,
  ): Promise<boolean> {
    const since = new Date(Date.now() - withinMinutes * 60 * 1000);
    const existing = await this.prisma.notification.findFirst({
      where: { userId, type, entityId: tripId, createdAt: { gte: since } },
    });
    return !!existing;
  }
}
