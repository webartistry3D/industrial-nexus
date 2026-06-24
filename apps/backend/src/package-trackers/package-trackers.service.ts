import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PackageTrackerStatus } from '@prisma/client';

interface CreatePackageTrackerDto {
  deviceId: string;
  name?: string;
}

interface UpdatePackageTrackerDto {
  name?: string;
  status?: PackageTrackerStatus;
  batteryLevel?: number;
}

@Injectable()
export class PackageTrackersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreatePackageTrackerDto, operatorId: string) {
    const existing = await this.prisma.packageTracker.findUnique({
      where: { deviceId: dto.deviceId },
    });

    if (existing) {
      throw new BadRequestException('Package tracker with this device ID already exists');
    }

    const tracker = await this.prisma.packageTracker.create({
      data: {
        deviceId: dto.deviceId,
        name: dto.name || dto.deviceId,
        status: PackageTrackerStatus.ACTIVE,
      },
    });

    await this.auditService.log({
      userId: operatorId,
      action: 'CREATE',
      entityType: 'PACKAGE_TRACKER',
      entityId: tracker.id,
      newValue: dto,
    });

    return tracker;
  }

  async findAll() {
    return this.prisma.packageTracker.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        orders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const tracker = await this.prisma.packageTracker.findUnique({
      where: { id },
      include: {
        orders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
          },
        },
      },
    });

    if (!tracker) {
      throw new NotFoundException('Package tracker not found');
    }

    return tracker;
  }

  async update(id: string, dto: UpdatePackageTrackerDto, operatorId: string) {
    const tracker = await this.prisma.packageTracker.findUnique({
      where: { id },
    });

    if (!tracker) {
      throw new NotFoundException('Package tracker not found');
    }

    const updated = await this.prisma.packageTracker.update({
      where: { id },
      data: dto,
    });

    await this.auditService.log({
      userId: operatorId,
      action: 'UPDATE',
      entityType: 'PACKAGE_TRACKER',
      entityId: id,
      newValue: dto,
    });

    return updated;
  }

  async remove(id: string, operatorId: string) {
    const tracker = await this.prisma.packageTracker.findUnique({
      where: { id },
      include: { orders: { take: 1 } },
    });

    if (!tracker) {
      throw new NotFoundException('Package tracker not found');
    }

    if (tracker.orders.length > 0) {
      throw new BadRequestException('Cannot delete package tracker that is assigned to an order');
    }

    await this.prisma.packageTracker.delete({
      where: { id },
    });

    await this.auditService.log({
      userId: operatorId,
      action: 'DELETE',
      entityType: 'PACKAGE_TRACKER',
      entityId: id,
      newValue: tracker,
    });

    return { deleted: true };
  }
}
