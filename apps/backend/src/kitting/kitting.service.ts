import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { KittingStage, KittingStatus, OrderStatus } from '@prisma/client';

interface KittingProgressDto {
  stage: KittingStage;
  barcodeVerified?: boolean;
  notes?: string;
}

@Injectable()
export class KittingService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async startKitting(orderId: string, operatorId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.APPROVED) {
      throw new BadRequestException(`Cannot start kitting for order in ${order.status} status`);
    }

    // Update order to KITTING status
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.KITTING,
        kittingStatus: KittingStatus.AGGREGATION,
      },
    });

    // Create initial kitting log
    const kittingLog = await this.prisma.kittingLog.create({
      data: {
        orderId,
        operatorId,
        stage: KittingStage.AGGREGATION,
        barcodeVerified: false,
      },
    });

    await this.auditService.log({
      userId: operatorId,
      action: 'CREATE',
      entityType: 'KITTING_LOG',
      entityId: kittingLog.id,
      newValue: { orderId, stage: KittingStage.AGGREGATION },
    });

    return kittingLog;
  }

  async progressKitting(
    orderId: string,
    operatorId: string,
    progressDto: KittingProgressDto,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { kittingLogs: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.KITTING) {
      throw new BadRequestException('Order is not in kitting status');
    }

    // Validate stage progression
    const currentStage = order.kittingLogs[0]?.stage;
    const nextStage = progressDto.stage;

    const validProgression: Record<KittingStage, KittingStage[]> = {
      [KittingStage.AGGREGATION]: [KittingStage.TECHNICAL_PACKAGING],
      [KittingStage.TECHNICAL_PACKAGING]: [KittingStage.QUALITY_CHECK],
      [KittingStage.QUALITY_CHECK]: [KittingStage.PACKAGE_TRACKER_ASSIGNMENT],
      [KittingStage.PACKAGE_TRACKER_ASSIGNMENT]: [KittingStage.DISPATCH_READY],
      [KittingStage.DISPATCH_READY]: [],
    };

    if (currentStage && !validProgression[currentStage].includes(nextStage)) {
      throw new BadRequestException(
        `Invalid kitting progression from ${currentStage} to ${nextStage}`,
      );
    }

    // Package tracker must be assigned before moving to DISPATCH_READY
    if (nextStage === KittingStage.DISPATCH_READY && !order.packageTrackerId) {
      throw new BadRequestException(
        'A package tracker must be assigned before final inspection / dispatch readiness',
      );
    }

    // Create kitting log for this stage
    const kittingLog = await this.prisma.kittingLog.create({
      data: {
        orderId,
        operatorId,
        stage: nextStage,
        barcodeVerified: progressDto.barcodeVerified || false,
        notes: progressDto.notes,
      },
    });

    // Update order kitting status
    const kittingStatusMap: Record<KittingStage, KittingStatus> = {
      [KittingStage.AGGREGATION]: KittingStatus.AGGREGATION,
      [KittingStage.TECHNICAL_PACKAGING]: KittingStatus.TECHNICAL_PACKAGING,
      [KittingStage.QUALITY_CHECK]: KittingStatus.QUALITY_CHECK,
      [KittingStage.PACKAGE_TRACKER_ASSIGNMENT]: KittingStatus.PACKAGE_TRACKER_ASSIGNMENT,
      [KittingStage.DISPATCH_READY]: KittingStatus.DISPATCH_READY,
    };

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        kittingStatus: kittingStatusMap[nextStage],
        // If dispatch ready, update order status
        ...(nextStage === KittingStage.DISPATCH_READY && {
          status: OrderStatus.DISPATCH_READY,
        }),
      },
    });

    await this.auditService.log({
      userId: operatorId,
      action: 'UPDATE',
      entityType: 'KITTING_LOG',
      entityId: kittingLog.id,
      newValue: { orderId, stage: nextStage, barcodeVerified: progressDto.barcodeVerified },
    });

    return kittingLog;
  }

  async completeKitting(orderId: string, operatorId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { kittingLogs: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const currentStage = order.kittingLogs[0]?.stage;

    // If tracker is assigned but the workflow is still at QUALITY_CHECK (e.g. from a previous failed attempt),
    // progress to PACKAGE_TRACKER_ASSIGNMENT first before completing.
    if (currentStage === KittingStage.QUALITY_CHECK && order.packageTrackerId) {
      await this.progressKitting(orderId, operatorId, {
        stage: KittingStage.PACKAGE_TRACKER_ASSIGNMENT,
        barcodeVerified: true,
        notes: 'Package tracker assigned',
      });
    }

    return this.progressKitting(orderId, operatorId, {
      stage: KittingStage.DISPATCH_READY,
      barcodeVerified: true,
      notes: 'Kitting workflow completed',
    });
  }

  async getKittingLogs(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.prisma.kittingLog.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
      include: {
        operator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async assignPackageTracker(orderId: string, packageTrackerId: string, operatorId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.KITTING) {
      throw new BadRequestException('Order is not in kitting status');
    }

    const packageTracker = await this.prisma.packageTracker.findUnique({
      where: { id: packageTrackerId },
    });

    if (!packageTracker) {
      throw new NotFoundException('Package tracker not found');
    }

    if (packageTracker.status !== 'ACTIVE') {
      throw new BadRequestException(`Package tracker is not active (status: ${packageTracker.status})`);
    }

    // Check if tracker is already assigned to another active order
    const existingOrder = await this.prisma.order.findFirst({
      where: {
        packageTrackerId,
        status: { in: [OrderStatus.KITTING, OrderStatus.DISPATCH_READY, OrderStatus.ASSIGNED, OrderStatus.IN_TRANSIT] },
      },
    });

    if (existingOrder && existingOrder.id !== orderId) {
      throw new BadRequestException('Package tracker is already assigned to another active order');
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: { packageTrackerId },
    });

    await this.auditService.log({
      userId: operatorId,
      action: 'UPDATE',
      entityType: 'ORDER',
      entityId: orderId,
      newValue: { packageTrackerId, deviceId: packageTracker.deviceId },
    });

    // Progress to PACKAGE_TRACKER_ASSIGNMENT stage so the workflow can later reach DISPATCH_READY
    const latestLog = await this.prisma.kittingLog.findFirst({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });

    if (latestLog?.stage === KittingStage.QUALITY_CHECK) {
      await this.prisma.kittingLog.create({
        data: {
          orderId,
          operatorId,
          stage: KittingStage.PACKAGE_TRACKER_ASSIGNMENT,
          barcodeVerified: true,
          notes: 'Package tracker assigned',
        },
      });

      await this.prisma.order.update({
        where: { id: orderId },
        data: { kittingStatus: KittingStatus.PACKAGE_TRACKER_ASSIGNMENT },
      });

      await this.auditService.log({
        userId: operatorId,
        action: 'UPDATE',
        entityType: 'KITTING_LOG',
        entityId: orderId,
        newValue: { orderId, stage: KittingStage.PACKAGE_TRACKER_ASSIGNMENT },
      });
    }

    return { assigned: true, packageTracker };
  }

  async unassignPackageTracker(orderId: string, operatorId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!order.packageTrackerId) {
      throw new BadRequestException('Order does not have an assigned package tracker');
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: { packageTrackerId: null },
    });

    await this.auditService.log({
      userId: operatorId,
      action: 'UPDATE',
      entityType: 'ORDER',
      entityId: orderId,
      newValue: { packageTrackerId: null },
    });

    return { unassigned: true };
  }

  async getAvailablePackageTrackers() {
    return this.prisma.packageTracker.findMany({
      where: {
        status: 'ACTIVE',
        orders: { none: {} },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async verifyBarcode(orderId: string, operatorId: string, barcode: string) {
    // In a real implementation, this would verify against a barcode database
    // For now, we'll just log the verification
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    await this.auditService.log({
      userId: operatorId,
      action: 'UPDATE',
      entityType: 'ORDER',
      entityId: orderId,
      newValue: { barcodeVerified: true, barcode },
    });

    return { verified: true, barcode };
  }
}
