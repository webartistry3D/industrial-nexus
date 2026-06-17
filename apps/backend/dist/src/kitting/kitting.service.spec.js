"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const kitting_service_1 = require("./kitting.service");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
describe('KittingService', () => {
    let service;
    let prisma;
    const mockPrisma = {
        order: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        kittingLog: {
            create: jest.fn(),
            findMany: jest.fn(),
        },
    };
    const mockAuditService = {
        log: jest.fn(),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                kitting_service_1.KittingService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrisma },
                { provide: audit_service_1.AuditService, useValue: mockAuditService },
            ],
        }).compile();
        service = module.get(kitting_service_1.KittingService);
        prisma = module.get(prisma_service_1.PrismaService);
        jest.clearAllMocks();
    });
    describe('startKitting', () => {
        it('should start kitting workflow for approved order', async () => {
            const mockOrder = {
                id: 'order-1',
                status: client_1.OrderStatus.APPROVED,
                kittingLogs: [],
            };
            mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
            mockPrisma.order.update.mockResolvedValue({ ...mockOrder, status: client_1.OrderStatus.KITTING });
            mockPrisma.kittingLog.create.mockResolvedValue({
                id: 'log-1',
                orderId: 'order-1',
                stage: client_1.KittingStage.AGGREGATION,
                operatorId: 'operator-1',
            });
            const result = await service.startKitting('order-1', 'operator-1');
            expect(result.stage).toBe(client_1.KittingStage.AGGREGATION);
            expect(mockPrisma.order.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    status: client_1.OrderStatus.KITTING,
                    kittingStatus: client_1.KittingStatus.AGGREGATION,
                }),
            }));
            expect(mockAuditService.log).toHaveBeenCalled();
        });
        it('should throw NotFoundException when order not found', async () => {
            mockPrisma.order.findUnique.mockResolvedValue(null);
            await expect(service.startKitting('non-existent', 'operator-1')).rejects.toThrow(common_1.NotFoundException);
        });
        it('should throw BadRequestException when order not approved', async () => {
            const mockOrder = {
                id: 'order-1',
                status: client_1.OrderStatus.DRAFT,
            };
            mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
            await expect(service.startKitting('order-1', 'operator-1')).rejects.toThrow(common_1.BadRequestException);
        });
    });
    describe('progressKitting', () => {
        it('should progress through kitting stages', async () => {
            const mockOrder = {
                id: 'order-1',
                status: client_1.OrderStatus.KITTING,
                kittingLogs: [{ stage: client_1.KittingStage.AGGREGATION }],
            };
            mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
            mockPrisma.kittingLog.create.mockResolvedValue({
                id: 'log-2',
                orderId: 'order-1',
                stage: client_1.KittingStage.TECHNICAL_PACKAGING,
            });
            const result = await service.progressKitting('order-1', 'operator-1', {
                stage: client_1.KittingStage.TECHNICAL_PACKAGING,
                barcodeVerified: true,
            });
            expect(result.stage).toBe(client_1.KittingStage.TECHNICAL_PACKAGING);
        });
        it('should complete kitting and set order to DISPATCH_READY', async () => {
            const mockOrder = {
                id: 'order-1',
                status: client_1.OrderStatus.KITTING,
                kittingLogs: [{ stage: client_1.KittingStage.QUALITY_CHECK }],
            };
            mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
            mockPrisma.kittingLog.create.mockResolvedValue({
                id: 'log-4',
                orderId: 'order-1',
                stage: client_1.KittingStage.DISPATCH_READY,
            });
            await service.progressKitting('order-1', 'operator-1', {
                stage: client_1.KittingStage.DISPATCH_READY,
                barcodeVerified: true,
            });
            expect(mockPrisma.order.update).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    status: client_1.OrderStatus.DISPATCH_READY,
                    kittingStatus: client_1.KittingStatus.DISPATCH_READY,
                }),
            }));
        });
        it('should throw BadRequestException for invalid progression', async () => {
            const mockOrder = {
                id: 'order-1',
                status: client_1.OrderStatus.KITTING,
                kittingLogs: [{ stage: client_1.KittingStage.AGGREGATION }],
            };
            mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
            await expect(service.progressKitting('order-1', 'operator-1', {
                stage: client_1.KittingStage.DISPATCH_READY,
            })).rejects.toThrow(common_1.BadRequestException);
        });
    });
    describe('getKittingLogs', () => {
        it('should return kitting logs with operator details', async () => {
            const mockOrder = { id: 'order-1' };
            const mockLogs = [
                {
                    id: 'log-1',
                    stage: client_1.KittingStage.AGGREGATION,
                    operator: { id: 'op-1', firstName: 'John', lastName: 'Doe' },
                },
            ];
            mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
            mockPrisma.kittingLog.findMany.mockResolvedValue(mockLogs);
            const result = await service.getKittingLogs('order-1');
            expect(result).toHaveLength(1);
            expect(result[0].stage).toBe(client_1.KittingStage.AGGREGATION);
        });
    });
});
//# sourceMappingURL=kitting.service.spec.js.map