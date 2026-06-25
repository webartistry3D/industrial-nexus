import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, KycDocumentStatus, VehicleDocumentStatus } from '@prisma/client';

const ALERT_WINDOW_DAYS = 90;
const REMINDER_INTERVAL_DAYS = 30;

interface ExpiryAlertTarget {
  userId: string;
  docLabel: string;
  daysUntilExpiry: number;
  expiryDateStr: string;
  docId: string;
  entityType: 'KYC_DOCUMENT' | 'VEHICLE_DOCUMENT';
  vehiclePlateNumber?: string;
}

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

    const alertTargets: ExpiryAlertTarget[] = [];

    // 1. KYC (driver) documents
    const expiringKycDocs = await this.prisma.kycDocument.findMany({
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

    for (const doc of expiringKycDocs) {
      const driverUserId = doc.driver?.user?.id;
      if (!driverUserId) continue;
      alertTargets.push({
        userId: driverUserId,
        docLabel: this.getDocTypeLabel(doc.documentType as string),
        daysUntilExpiry: Math.ceil((doc.expiresAt!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        expiryDateStr: this.formatDate(doc.expiresAt!),
        docId: doc.id,
        entityType: 'KYC_DOCUMENT',
      });
    }

    // 2. Vehicle documents
    const expiringVehicleDocs = await this.prisma.vehicleDocument.findMany({
      where: {
        expiresAt: {
          gte: recentlyExpiredCutoff,
          lte: alertWindowEnd,
        },
        status: {
          in: [VehicleDocumentStatus.VERIFIED, VehicleDocumentStatus.PENDING, VehicleDocumentStatus.UNDER_REVIEW],
        },
      },
      include: {
        vehicle: {
          include: {
            drivers: {
              where: { status: 'ACTIVE' },
              include: {
                user: { select: { id: true, firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });

    for (const doc of expiringVehicleDocs) {
      const drivers = doc.vehicle?.drivers || [];
      if (drivers.length === 0) continue;

      const daysUntilExpiry = Math.ceil((doc.expiresAt!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const expiryDateStr = this.formatDate(doc.expiresAt!);
      const docLabel = this.getVehicleDocTypeLabel(doc.documentType as string);
      const plateNumber = doc.vehicle?.plateNumber || 'Unknown';

      for (const driver of drivers) {
        const driverUserId = driver.user?.id;
        if (!driverUserId) continue;
        alertTargets.push({
          userId: driverUserId,
          docLabel,
          daysUntilExpiry,
          expiryDateStr,
          docId: doc.id,
          entityType: 'VEHICLE_DOCUMENT',
          vehiclePlateNumber: plateNumber,
        });
      }
    }

    this.logger.log(`[DocumentExpiry] Found ${alertTargets.length} alert targets expiring within ${ALERT_WINDOW_DAYS} days`);

    for (const target of alertTargets) {
      const isDuplicate = await this.hasSentRecentAlert(target.userId, target.docId, target.entityType, REMINDER_INTERVAL_DAYS);
      if (isDuplicate) continue;

      const { title, message } = this.buildAlertMessage(target);

      await this.notificationsService.create({
        userId: target.userId,
        type: NotificationType.DOCUMENT_EXPIRY_ALERT,
        title,
        message,
        entityId: target.docId,
        entityType: target.entityType,
      });

      this.logger.log(
        `[DocumentExpiry] Notified user ${target.userId} about ${target.docLabel} (${target.entityType}) expiring in ${target.daysUntilExpiry} days`,
      );
    }

    this.logger.log('[DocumentExpiry] Daily check complete');
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  private buildAlertMessage(target: ExpiryAlertTarget) {
    const { docLabel, daysUntilExpiry, expiryDateStr, entityType, vehiclePlateNumber } = target;
    const subject = entityType === 'VEHICLE_DOCUMENT' && vehiclePlateNumber
      ? `${docLabel} for vehicle ${vehiclePlateNumber}`
      : `Your ${docLabel}`;

    let title: string;
    let message: string;

    if (daysUntilExpiry <= 0) {
      const daysAgo = Math.abs(daysUntilExpiry);
      title = `🚨 ${docLabel} Has Expired`;
      message = `${subject} expired on ${expiryDateStr}${daysAgo > 0 ? ` (${daysAgo} day${daysAgo === 1 ? '' : 's'} ago)` : ' today'}. Renew immediately to avoid suspension.`;
    } else if (daysUntilExpiry <= 7) {
      title = `⚠️ ${docLabel} Expires in ${daysUntilExpiry} Day${daysUntilExpiry === 1 ? '' : 's'}`;
      message = `${subject} is expiring on ${expiryDateStr}. Please renew it immediately to avoid suspension.`;
    } else if (daysUntilExpiry <= 30) {
      title = `${docLabel} Expiring Soon`;
      message = `${subject} expires on ${expiryDateStr} — ${daysUntilExpiry} days remaining. Please renew it.`;
    } else {
      title = `${docLabel} Expiry Reminder`;
      message = `${subject} will expire on ${expiryDateStr} (${daysUntilExpiry} days from now). Start the renewal process early.`;
    }

    return { title, message };
  }

  private async hasSentRecentAlert(userId: string, docId: string, entityType: 'KYC_DOCUMENT' | 'VEHICLE_DOCUMENT', withinDays: number): Promise<boolean> {
    const since = new Date();
    since.setDate(since.getDate() - withinDays);

    const existing = await this.prisma.notification.findFirst({
      where: {
        userId,
        type: NotificationType.DOCUMENT_EXPIRY_ALERT,
        entityId: docId,
        entityType,
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

  private getVehicleDocTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      VEHICLE_REGISTRATION: 'Vehicle Registration',
      ROAD_WORTHINESS: 'Road Worthiness Certificate',
      INSURANCE_CERTIFICATE: 'Insurance Certificate',
      VEHICLE_LICENSE: 'Vehicle License',
      HAULAGE_PERMIT: 'Haulage Permit',
      TEMPERATURE_CONTROL_CERTIFICATION: 'Temperature Control Certification',
      HAZARDOUS_MATERIAL_CERTIFICATION: 'Hazardous Material Certification',
    };
    return labels[type] || type;
  }
}
