"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KittingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const client_1 = require("@prisma/client");
let KittingService = class KittingService {
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async startKitting(orderId, operatorId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        if (order.status !== client_1.OrderStatus.APPROVED) {
            throw new common_1.BadRequestException(`Cannot start kitting for order in ${order.status} status`);
        }
        await this.prisma.order.update({
            where: { id: orderId },
            data: {
                status: client_1.OrderStatus.KITTING,
                kittingStatus: client_1.KittingStatus.AGGREGATION,
            },
        });
        const kittingLog = await this.prisma.kittingLog.create({
            data: {
                orderId,
                operatorId,
                stage: client_1.KittingStage.AGGREGATION,
                barcodeVerified: false,
            },
        });
        await this.auditService.log({
            userId: operatorId,
            action: 'CREATE',
            entityType: 'KITTING_LOG',
            entityId: kittingLog.id,
            newValue: { orderId, stage: client_1.KittingStage.AGGREGATION },
        });
        return kittingLog;
    }
    async progressKitting(orderId, operatorId, progressDto) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { kittingLogs: { orderBy: { createdAt: 'desc' }, take: 1 } },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        if (order.status !== client_1.OrderStatus.KITTING) {
            throw new common_1.BadRequestException('Order is not in kitting status');
        }
        const currentStage = order.kittingLogs[0]?.stage;
        const nextStage = progressDto.stage;
        const validProgression = {
            [client_1.KittingStage.AGGREGATION]: [client_1.KittingStage.TECHNICAL_PACKAGING],
            [client_1.KittingStage.TECHNICAL_PACKAGING]: [client_1.KittingStage.QUALITY_CHECK],
            [client_1.KittingStage.QUALITY_CHECK]: [client_1.KittingStage.DISPATCH_READY],
            [client_1.KittingStage.DISPATCH_READY]: [],
        };
        if (currentStage && !validProgression[currentStage].includes(nextStage)) {
            throw new common_1.BadRequestException(`Invalid kitting progression from ${currentStage} to ${nextStage}`);
        }
        const kittingLog = await this.prisma.kittingLog.create({
            data: {
                orderId,
                operatorId,
                stage: nextStage,
                barcodeVerified: progressDto.barcodeVerified || false,
                notes: progressDto.notes,
            },
        });
        const kittingStatusMap = {
            [client_1.KittingStage.AGGREGATION]: client_1.KittingStatus.AGGREGATION,
            [client_1.KittingStage.TECHNICAL_PACKAGING]: client_1.KittingStatus.TECHNICAL_PACKAGING,
            [client_1.KittingStage.QUALITY_CHECK]: client_1.KittingStatus.QUALITY_CHECK,
            [client_1.KittingStage.DISPATCH_READY]: client_1.KittingStatus.DISPATCH_READY,
        };
        await this.prisma.order.update({
            where: { id: orderId },
            data: {
                kittingStatus: kittingStatusMap[nextStage],
                ...(nextStage === client_1.KittingStage.DISPATCH_READY && {
                    status: client_1.OrderStatus.DISPATCH_READY,
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
    async completeKitting(orderId, operatorId) {
        return this.progressKitting(orderId, operatorId, {
            stage: client_1.KittingStage.DISPATCH_READY,
            barcodeVerified: true,
            notes: 'Kitting workflow completed',
        });
    }
    async getKittingLogs(orderId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
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
    async verifyBarcode(orderId, operatorId, barcode) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
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
};
exports.KittingService = KittingService;
exports.KittingService = KittingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], KittingService);
//# sourceMappingURL=kitting.service.js.map