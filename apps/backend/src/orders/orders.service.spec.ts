import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { OrderStatus, UserRole, Priority, KittingStatus } from '@prisma/client';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: PrismaService;

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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create order with DRAFT status and log audit', async () => {
      const createOrderDto = {
        totalWeight: 1000,
        priority: Priority.NORMAL,
        pickupLocation: { lat: 6.5244, lng: 3.3792, address: 'Lagos' },
        deliveryLocation: { lat: 6.9, lng: 3.5, address: 'Ogun' },
        cargoDescription: 'Industrial parts',
        handlingTags: [],
      };

      const createdOrder = {
        id: 'order-1',
        orderNumber: 'IN-ORD-2024-000001',
        ...createOrderDto,
        status: OrderStatus.DRAFT,
        clientId: 'user-1',
      };

      mockPrisma.order.count.mockResolvedValue(0);
      mockPrisma.order.create.mockResolvedValue(createdOrder);
      mockPrisma.order.findUnique.mockResolvedValue(createdOrder);

      const result = await service.create(createOrderDto, 'user-1', UserRole.CLIENT);

      expect(result.status).toBe(OrderStatus.DRAFT);
      expect(mockPrisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: OrderStatus.DRAFT,
            kittingStatus: KittingStatus.PENDING,
          }),
        }),
      );
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('should create handling tags when provided', async () => {
      const createOrderDto = {
        totalWeight: 1000,
        pickupLocation: { lat: 6.5244, lng: 3.3792, address: 'Lagos' },
        deliveryLocation: { lat: 6.9, lng: 3.5, address: 'Ogun' },
        handlingTags: ['FRAGILE', 'HEAVY'],
      };

      const createdOrder = {
        id: 'order-1',
        orderNumber: 'IN-ORD-2024-000001',
        status: OrderStatus.DRAFT,
      };

      mockPrisma.order.count.mockResolvedValue(0);
      mockPrisma.order.create.mockResolvedValue(createdOrder);
      mockPrisma.order.findUnique.mockResolvedValue(createdOrder);

      await service.create(createOrderDto, 'user-1', UserRole.CLIENT);

      expect(mockPrisma.handlingTag.createMany).toHaveBeenCalledWith({
        data: [
          { orderId: 'order-1', tag: 'FRAGILE' },
          { orderId: 'order-1', tag: 'HEAVY' },
        ],
      });
    });
  });

  describe('changeStatus', () => {
    it('should validate status transitions', async () => {
      const mockOrder = {
        id: 'order-1',
        status: OrderStatus.DRAFT,
        clientId: 'user-1',
      };

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.order.update.mockResolvedValue({ ...mockOrder, status: OrderStatus.SUBMITTED });

      const result = await service.changeStatus(
        'order-1',
        OrderStatus.SUBMITTED,
        'user-1',
        UserRole.CLIENT,
      );

      expect(result.status).toBe(OrderStatus.SUBMITTED);
    });

    it('should throw BadRequestException for invalid transition', async () => {
      const mockOrder = {
        id: 'order-1',
        status: OrderStatus.DELIVERED,
        clientId: 'user-1',
      };

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      await expect(
        service.changeStatus('order-1', OrderStatus.SUBMITTED, 'user-1', UserRole.CLIENT),
      ).rejects.toThrow(BadRequestException);
    });

    it('should require admin/operations to approve order', async () => {
      const mockOrder = {
        id: 'order-1',
        status: OrderStatus.SUBMITTED,
        clientId: 'user-1',
      };

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      await expect(
        service.changeStatus('order-1', OrderStatus.APPROVED, 'user-1', UserRole.CLIENT),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should only allow updates in DRAFT or SUBMITTED status', async () => {
      const mockOrder = {
        id: 'order-1',
        status: OrderStatus.IN_TRANSIT,
        clientId: 'user-1',
      };

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      await expect(
        service.update('order-1', { cargoDescription: 'Updated' }, 'user-1', UserRole.CLIENT),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update handling tags', async () => {
      const mockOrder = {
        id: 'order-1',
        status: OrderStatus.DRAFT,
        clientId: 'user-1',
        handlingTags: [{ tag: 'FRAGILE' }],
      };

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.order.update.mockResolvedValue({ ...mockOrder, cargoDescription: 'Updated' });

      await service.update(
        'order-1',
        { handlingTags: ['HEAVY', 'CHEMICAL'] },
        'user-1',
        UserRole.CLIENT,
      );

      expect(mockPrisma.handlingTag.deleteMany).toHaveBeenCalledWith({ where: { orderId: 'order-1' } });
      expect(mockPrisma.handlingTag.createMany).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should filter orders by role', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.order.count.mockResolvedValue(0);

      await service.findAll({}, 'client-id', UserRole.CLIENT);

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ clientId: 'client-id' }),
        }),
      );
    });

    it('should allow admin to see all orders', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);
      mockPrisma.order.count.mockResolvedValue(0);

      await service.findAll({}, 'admin-id', UserRole.SUPER_ADMIN);

      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        }),
      );
    });
  });
});
