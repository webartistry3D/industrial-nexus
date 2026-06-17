import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '@prisma/client';

interface AuditLogEntry {
  userId?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: entry.userId,
          action: entry.action,
          entityType: entry.entityType,
          entityId: entry.entityId,
          oldValue: entry.oldValue || null,
          newValue: entry.newValue || null,
          ipAddress: entry.ipAddress || null,
          userAgent: entry.userAgent || null,
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }

  async getAuditLogs(userId?: string, entityType?: string, limit = 50) {
    const where: any = {};
    
    if (userId) where.userId = userId;
    if (entityType) where.entityType = entityType;

    return this.prisma.auditLog.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }
}
