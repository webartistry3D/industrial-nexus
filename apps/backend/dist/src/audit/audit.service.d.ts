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
export declare class AuditService {
    private prisma;
    constructor(prisma: PrismaService);
    log(entry: AuditLogEntry): Promise<void>;
    getAuditLogs(userId?: string, entityType?: string, limit?: number): Promise<({
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string | null;
        action: import(".prisma/client").$Enums.AuditAction;
        entityType: string;
        entityId: string | null;
        oldValue: import("@prisma/client/runtime/library").JsonValue | null;
        newValue: import("@prisma/client/runtime/library").JsonValue | null;
        ipAddress: string | null;
        userAgent: string | null;
    })[]>;
}
export {};
