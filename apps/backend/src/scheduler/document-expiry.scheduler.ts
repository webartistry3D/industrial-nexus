import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, KycDocumentStatus } from '@prisma/client';

const ALERT_WINDOW_DAYS = 90;
const REMINDER_INTERVAL_DAYS = 30;

@Injectable()
export class DocumentExpiryScheduler {
  private readonly logger = new Logger(DocumentExpiryScheduler.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkDocumentExpiries() {
    this.logger.log('[DocumentExpiry] Running daily document expiry check...');

    const now = new Date();
    const alertWindowEnd = new Date(now);
    alertWindowEnd.setDate(alertWindowEnd.getDate() + ALERT_WINDOW_DAYS);
    const recentlyExpiredCutoff = new Date(now);
    recentlyExpiredCutoff.setDate(recentlyExpiredCutoff.getDate() - 7);

    const expiringDocs = await this.prisma.kycDocument.findMany({
      where: {
        expiresAt: {
          gte: recentlyExpiredCutoff,
          lte: alertWindowEnd,
        },
        status: {
          in: [KycDocumentStatus.VERIFIED, KycDocumentStatus.PENDING, KycDocumentStatus.UNDER_REVIEW],
        },
      },
      include: {
        driver: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
    });

    this.logger.log(`[DocumentExpiry] Found ${expiringDocs.length} documents expiring within ${ALERT_WINDOW_DAYS} days`);

    for (const doc of expiringDocs) {
      const driverUserId = doc.driver?.user?.id;
      if (!driverUserId) continue;

      const daysUntilExpiry = Math.ceil(
        (doc.expiresAt!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      const docLabel = this.getDocTypeLabel(doc.documentType as string);
      const expiryDateStr = doc.expiresAt!.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      const isDuplicate = await this.hasSentRecentAlert(driverUserId, doc.id, REMINDER_INTERVAL_DAYS);
      if (isDuplicate) continue;

      let title: string;
      let message: string;

      if (daysUntilExpiry <= 0) {
        const daysAgo = Math.abs(daysUntilExpiry);
        title = `🚨 ${docLabel} Has Expired`;
        message = `Your ${docLabel} expired on ${expiryDateStr}${daysAgo > 0 ? ` (${daysAgo} day${daysAgo === 1 ? '' : 's'} ago)` : ' today'}. Renew immediately to avoid suspension.`;
      } else if (daysUntilExpiry <= 7) {
        title = `⚠️ ${docLabel} Expires in ${daysUntilExpiry} Day${daysUntilExpiry === 1 ? '' : 's'}`;
        message = `Your ${docLabel} is expiring on ${expiryDateStr}. Please renew it immediately to avoid suspension.`;
      } else if (daysUntilExpiry <= 30) {
        title = `${docLabel} Expiring Soon`;
        message = `Your ${docLabel} expires on ${expiryDateStr} — ${daysUntilExpiry} days remaining. Please renew it.`;
      } else {
        title = `${docLabel} Expiry Reminder`;
        message = `Your ${docLabel} will expire on ${expiryDateStr} (${daysUntilExpiry} days from now). Start the renewal process early.`;
      }

      await this.notificationsService.create({
        userId: driverUserId,
        type: NotificationType.DOCUMENT_EXPIRY_ALERT,
        title,
        message,
        entityId: doc.id,
        entityType: 'KYC_DOCUMENT',
      });

      this.logger.log(
        `[DocumentExpiry] Notified driver ${driverUserId} about ${docLabel} expiring in ${daysUntilExpiry} days`,
      );
    }

    this.logger.log('[DocumentExpiry] Daily check complete');
  }

  private async hasSentRecentAlert(userId: string, docId: string, withinDays: number): Promise<boolean> {
    const since = new Date();
    since.setDate(since.getDate() - withinDays);

    const existing = await this.prisma.notification.findFirst({
      where: {
        userId,
        type: NotificationType.DOCUMENT_EXPIRY_ALERT,
        entityId: docId,
        entityType: 'KYC_DOCUMENT',
        createdAt: { gte: since },
      },
    });

    return !!existing;
  }

  private getDocTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      GOVERNMENT_ID: 'Government ID',
      DRIVERS_LICENSE: "Driver's License",
      PROOF_OF_ADDRESS: 'Proof of Address',
      VEHICLE_REGISTRATION: 'Vehicle Registration',
      INSURANCE_CERTIFICATE: 'Insurance Certificate',
      PROFESSIONAL_CERTIFICATION: 'Professional Certification',
    };
    return labels[type] || type;
  }
}
