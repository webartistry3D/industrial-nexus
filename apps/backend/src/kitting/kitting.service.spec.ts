import { Test, TestingModule } from '@nestjs/testing';
import { KittingService } from './kitting.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OrderStatus, KittingStage, KittingStatus } from '@prisma/client';

describe('KittingService', () => {
  let service: KittingService;
  let prisma: PrismaService;

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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KittingService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<KittingService>(KittingService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('startKitting', () => {
    it('should start kitting workflow for approved order', async () => {
      const mockOrder = {
        id: 'order-1',
        status: OrderStatus.APPROVED,
        kittingLogs: [],
      };

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.order.update.mockResolvedValue({ ...mockOrder, status: OrderStatus.KITTING });
      mockPrisma.kittingLog.create.mockResolvedValue({
        id: 'log-1',
        orderId: 'order-1',
        stage: KittingStage.AGGREGATION,
        operatorId: 'operator-1',
      });

      const result = await service.startKitting('order-1', 'operator-1');

      expect(result.stage).toBe(KittingStage.AGGREGATION);
      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: OrderStatus.KITTING,
            kittingStatus: KittingStatus.AGGREGATION,
          }),
        }),
      );
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('should throw NotFoundException when order not found', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(service.startKitting('non-existent', 'operator-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when order not approved', async () => {
      const mockOrder = {
        id: 'order-1',
        status: OrderStatus.DRAFT,
      };

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      await expect(service.startKitting('order-1', 'operator-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('progressKitting', () => {
    it('should progress through kitting stages', async () => {
      const mockOrder = {
        id: 'order-1',
        status: OrderStatus.KITTING,
        kittingLogs: [{ stage: KittingStage.AGGREGATION }],
      };

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.kittingLog.create.mockResolvedValue({
        id: 'log-2',
        orderId: 'order-1',
        stage: KittingStage.TECHNICAL_PACKAGING,
      });

      const result = await service.progressKitting('order-1', 'operator-1', {
        stage: KittingStage.TECHNICAL_PACKAGING,
        barcodeVerified: true,
      });

      expect(result.stage).toBe(KittingStage.TECHNICAL_PACKAGING);
    });

    it('should complete kitting and set order to DISPATCH_READY', async () => {
      const mockOrder = {
        id: 'order-1',
        status: OrderStatus.KITTING,
        kittingLogs: [{ stage: KittingStage.QUALITY_CHECK }],
      };

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.kittingLog.create.mockResolvedValue({
        id: 'log-4',
        orderId: 'order-1',
        stage: KittingStage.DISPATCH_READY,
      });

      await service.progressKitting('order-1', 'operator-1', {
        stage: KittingStage.DISPATCH_READY,
        barcodeVerified: true,
      });

      expect(mockPrisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: OrderStatus.DISPATCH_READY,
            kittingStatus: KittingStatus.DISPATCH_READY,
          }),
        }),
      );
    });

    it('should throw BadRequestException for invalid progression', async () => {
      const mockOrder = {
        id: 'order-1',
        status: OrderStatus.KITTING,
        kittingLogs: [{ stage: KittingStage.AGGREGATION }],
      };

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      await expect(
        service.progressKitting('order-1', 'operator-1', {
          stage: KittingStage.DISPATCH_READY, // Skip stages
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getKittingLogs', () => {
    it('should return kitting logs with operator details', async () => {
      const mockOrder = { id: 'order-1' };
      const mockLogs = [
        {
          id: 'log-1',
          stage: KittingStage.AGGREGATION,
          operator: { id: 'op-1', firstName: 'John', lastName: 'Doe' },
        },
      ];

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.kittingLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.getKittingLogs('order-1');

      expect(result).toHaveLength(1);
      expect(result[0].stage).toBe(KittingStage.AGGREGATION);
    });
  });
});
