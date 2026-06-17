import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { KittingStage } from '@prisma/client';
interface KittingProgressDto {
    stage: KittingStage;
    barcodeVerified?: boolean;
    notes?: string;
}
export declare class KittingService {
    private prisma;
    private auditService;
    constructor(prisma: PrismaService, auditService: AuditService);
    startKitting(orderId: string, operatorId: string): Promise<{
        id: string;
        createdAt: Date;
        orderId: string;
        barcodeVerified: boolean;
        notes: string | null;
        stage: import(".prisma/client").$Enums.KittingStage;
        operatorId: string;
    }>;
    progressKitting(orderId: string, operatorId: string, progressDto: KittingProgressDto): Promise<{
        id: string;
        createdAt: Date;
        orderId: string;
        barcodeVerified: boolean;
        notes: string | null;
        stage: import(".prisma/client").$Enums.KittingStage;
        operatorId: string;
    }>;
    completeKitting(orderId: string, operatorId: string): Promise<{
        id: string;
        createdAt: Date;
        orderId: string;
        barcodeVerified: boolean;
        notes: string | null;
        stage: import(".prisma/client").$Enums.KittingStage;
        operatorId: string;
    }>;
    getKittingLogs(orderId: string): Promise<({
        operator: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        orderId: string;
        barcodeVerified: boolean;
        notes: string | null;
        stage: import(".prisma/client").$Enums.KittingStage;
        operatorId: string;
    })[]>;
    verifyBarcode(orderId: string, operatorId: string, barcode: string): Promise<{
        verified: boolean;
        barcode: string;
    }>;
}
export {};
