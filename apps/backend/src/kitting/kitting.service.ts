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
      [KittingStage.QUALITY_CHECK]: [KittingStage.DISPATCH_READY],
      [KittingStage.DISPATCH_READY]: [],
    };

    if (currentStage && !validProgression[currentStage].includes(nextStage)) {
      throw new BadRequestException(
        `Invalid kitting progression from ${currentStage} to ${nextStage}`,
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
