"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const orders_service_1 = require("./orders.service");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
describe('OrdersService', () => {
    let service;
    let prisma;
    const mockPrisma = {
        order: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            deleteMany: jest.fn(),
            count: jest.fn(),
        },
        handlingTag: {
            createMany: jest.fn(),
            deleteMany: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
        },
    };
    const mockAuditService = {
        log: jest.fn(),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                orders_service_1.OrdersService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrisma },
                { provide: audit_service_1.AuditService, useValue: mockAuditService },
            ],
        }).compile();
        service = module.get(orders_service_1.OrdersService);
        prisma = module.get(prisma_service_1.PrismaService);
        jest.clearAllMocks();
    });
    describe('create', () => {
        it('should create order with DRAFT status and log audit', async () => {
            const createOrderDto = {
                totalWeight: 1000,
                priority: client_1.Priority.NORMAL,
                pickupLocation: { lat: 6.5244, lng: 3.3792, address: 'Lagos' },
                deliveryLocation: { lat: 6.9, lng: 3.5, address: 'Ogun' },
                cargoDescription: 'Industrial parts',
                handlingTags: [],
            };
            const createdOrder = {
                id: 'order-1',
                orderNumber: 'ORD-2024-000001',
                ...createOrderDto,
                status: client_1.OrderStatus.DRAFT,
                clientId: 'user-1',
            };
            mockPrisma.order.count.mockResolvedValue(0);
            mockPrisma.order.create.mockResolvedValue(createdOrder);
            mockPrisma.order.findUnique.mockResolvedValue(createdOrder);
            const result = await service.create(createOrderDto, 'user-1', client_1.UserRole.CLIENT);
            expect(result.status).toBe(client_1.OrderStatus.DRAFT);
            expect(mockPrisma.order.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    status: client_1.OrderStatus.DRAFT,
                    kittingStatus: client_1.KittingStatus.PENDING,
                }),
            }));
            expect(mockAuditService.log).toHaveBeenCalled();
        });
        it('should create handling tags when provided', async () => {
            const createOrderDto = {
                totalWeight: 1000,
                pickupLocation: { lat: 6.5244, lng: 3.3792, address: 'Lagos' },
                deliveryLocation: { lat: 6.9, lng: 3.5, address: 'Ogun' },
                handlingTags: [client_1.HandlingTagType.FRAGILE, client_1.HandlingTagType.HEAVY],
            };
            const createdOrder = {
                id: 'order-1',
                orderNumber: 'ORD-2024-000001',
                status: client_1.OrderStatus.DRAFT,
            };
            mockPrisma.order.count.mockResolvedValue(0);
            mockPrisma.order.create.mockResolvedValue(createdOrder);
            mockPrisma.order.findUnique.mockResolvedValue(createdOrder);
            await service.create(createOrderDto, 'user-1', client_1.UserRole.CLIENT);
            expect(mockPrisma.handlingTag.createMany).toHaveBeenCalledWith({
                data: [
                    { orderId: 'order-1', tag: client_1.HandlingTagType.FRAGILE },
                    { orderId: 'order-1', tag: client_1.HandlingTagType.HEAVY },
                ],
            });
        });
    });
    describe('changeStatus', () => {
        it('should validate status transitions', async () => {
            const mockOrder = {
                id: 'order-1',
                status: client_1.OrderStatus.DRAFT,
                clientId: 'user-1',
            };
            mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
            mockPrisma.order.update.mockResolvedValue({ ...mockOrder, status: client_1.OrderStatus.SUBMITTED });
            const result = await service.changeStatus('order-1', client_1.OrderStatus.SUBMITTED, 'user-1', client_1.UserRole.CLIENT);
            expect(result.status).toBe(client_1.OrderStatus.SUBMITTED);
        });
        it('should throw BadRequestException for invalid transition', async () => {
            const mockOrder = {
                id: 'order-1',
                status: client_1.OrderStatus.DELIVERED,
                clientId: 'user-1',
            };
            mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
            await expect(service.changeStatus('order-1', client_1.OrderStatus.SUBMITTED, 'user-1', client_1.UserRole.CLIENT)).rejects.toThrow(common_1.BadRequestException);
        });
        it('should require admin/operations to approve order', async () => {
            const mockOrder = {
                id: 'order-1',
                status: client_1.OrderStatus.SUBMITTED,
                clientId: 'user-1',
            };
            mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
            await expect(service.changeStatus('order-1', client_1.OrderStatus.APPROVED, 'user-1', client_1.UserRole.CLIENT)).rejects.toThrow(common_1.ForbiddenException);
        });
    });
    describe('update', () => {
        it('should only allow updates in DRAFT or SUBMITTED status', async () => {
            const mockOrder = {
                id: 'order-1',
                status: client_1.OrderStatus.IN_TRANSIT,
                clientId: 'user-1',
            };
            mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
            await expect(service.update('order-1', { cargoDescription: 'Updated' }, 'user-1', client_1.UserRole.CLIENT)).rejects.toThrow(common_1.BadRequestException);
        });
        it('should update handling tags', async () => {
            const mockOrder = {
                id: 'order-1',
                status: client_1.OrderStatus.DRAFT,
                clientId: 'user-1',
                handlingTags: [{ tag: 'FRAGILE' }],
            };
            mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
            mockPrisma.order.update.mockResolvedValue({ ...mockOrder, cargoDescription: 'Updated' });
            await service.update('order-1', { handlingTags: [client_1.HandlingTagType.HEAVY, client_1.HandlingTagType.CHEMICAL] }, 'user-1', client_1.UserRole.CLIENT);
            expect(mockPrisma.handlingTag.deleteMany).toHaveBeenCalledWith({ where: { orderId: 'order-1' } });
            expect(mockPrisma.handlingTag.createMany).toHaveBeenCalled();
        });
    });
    describe('findAll', () => {
        it('should filter orders by role', async () => {
            mockPrisma.order.findMany.mockResolvedValue([]);
            mockPrisma.order.count.mockResolvedValue(0);
            await service.findAll({}, 'client-id', client_1.UserRole.CLIENT);
            expect(mockPrisma.order.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ clientId: 'client-id' }),
            }));
        });
        it('should allow admin to see all orders', async () => {
            mockPrisma.order.findMany.mockResolvedValue([]);
            mockPrisma.order.count.mockResolvedValue(0);
            await service.findAll({}, 'admin-id', client_1.UserRole.SUPER_ADMIN);
            expect(mockPrisma.order.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: {},
            }));
        });
    });
});
//# sourceMappingURL=orders.service.spec.js.map