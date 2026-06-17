import { KittingService } from './kitting.service';
import { UserRole, KittingStage } from '@prisma/client';
declare class StartKittingDto {
    orderId: string;
}
declare class ProgressKittingDto {
    stage: KittingStage;
    barcodeVerified?: boolean;
    notes?: string;
}
declare class VerifyBarcodeDto {
    barcode: string;
}
export declare class KittingController {
    private readonly kittingService;
    constructor(kittingService: KittingService);
    startKitting(dto: StartKittingDto, user: {
        userId: string;
        role: UserRole;
    }): Promise<{
        id: string;
        createdAt: Date;
        orderId: string;
        barcodeVerified: boolean;
        notes: string | null;
        stage: import(".prisma/client").$Enums.KittingStage;
        operatorId: string;
    }>;
    progressKitting(orderId: string, dto: ProgressKittingDto, user: {
        userId: string;
        role: UserRole;
    }): Promise<{
        id: string;
        createdAt: Date;
        orderId: string;
        barcodeVerified: boolean;
        notes: string | null;
        stage: import(".prisma/client").$Enums.KittingStage;
        operatorId: string;
    }>;
    completeKitting(orderId: string, user: {
        userId: string;
        role: UserRole;
    }): Promise<{
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
    verifyBarcode(orderId: string, dto: VerifyBarcodeDto, user: {
        userId: string;
        role: UserRole;
    }): Promise<{
        verified: boolean;
        barcode: string;
    }>;
}
export {};
