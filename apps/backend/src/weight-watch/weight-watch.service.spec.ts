import { Test, TestingModule } from '@nestjs/testing';
import { WeightWatchService } from './weight-watch.service';
import { PrismaService } from '../prisma/prisma.service';
import { WeightStatus } from '@prisma/client';

describe('WeightWatchService', () => {
  let service: WeightWatchService;
  let prisma: PrismaService;

  const mockPrisma = {
    vehicle: {
      findUnique: jest.fn(),
    },
    weightRecord: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeightWatchService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<WeightWatchService>(WeightWatchService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('validateTripWeight', () => {
    it('should return SAFE for utilization <= 70%', async () => {
      const mockVehicle = {
        id: 'vehicle-1',
        capacityKg: 5000,
        isPartitioned: false,
      };

      mockPrisma.vehicle.findUnique.mockResolvedValue(mockVehicle);

      const result = await service.validateTripWeight(3500, 'vehicle-1', []);

      expect(result.canAssign).toBe(true);
      expect(result.status).toBe(WeightStatus.SAFE);
      expect(result.utilization).toBe(0.7);
    });

    it('should return WARNING for utilization 71-85%', async () => {
      const mockVehicle = {
        id: 'vehicle-1',
        capacityKg: 5000,
        isPartitioned: false,
      };

      mockPrisma.vehicle.findUnique.mockResolvedValue(mockVehicle);

      const result = await service.validateTripWeight(4000, 'vehicle-1', []);

      expect(result.canAssign).toBe(true);
      expect(result.status).toBe(WeightStatus.WARNING);
      expect(result.utilization).toBe(0.8);
    });

    it('should block dispatch when NEAR_CAPACITY 86-94%', async () => {
      const mockVehicle = {
        id: 'vehicle-1',
        capacityKg: 5000,
        isPartitioned: false,
      };

      mockPrisma.vehicle.findUnique.mockResolvedValue(mockVehicle);

      const result = await service.validateTripWeight(4500, 'vehicle-1', []);

      expect(result.canAssign).toBe(false);
      expect(result.status).toBe(WeightStatus.NEAR_CAPACITY);
      expect(result.reason).toContain('exceeds the safe limit');
    });

    it('should block dispatch when OVERLOADED > 94%', async () => {
      const mockVehicle = {
        id: 'vehicle-1',
        capacityKg: 5000,
        isPartitioned: false,
      };

      mockPrisma.vehicle.findUnique.mockResolvedValue(mockVehicle);

      const result = await service.validateTripWeight(4750, 'vehicle-1', []);

      expect(result.canAssign).toBe(false);
      expect(result.status).toBe(WeightStatus.OVERLOADED);
      expect(result.reason).toContain('exceeds the safe limit');
    });

    it('should return error when vehicle not found', async () => {
      mockPrisma.vehicle.findUnique.mockResolvedValue(null);

      const result = await service.validateTripWeight(1000, 'non-existent', []);

      expect(result.canAssign).toBe(false);
      expect(result.status).toBe(WeightStatus.OVERLOADED);
      expect(result.reason).toBe('Vehicle not found');
    });

    it('should detect CHEMICAL + HAZARDOUS as incompatible', async () => {
      const mockVehicle = {
        id: 'vehicle-1',
        capacityKg: 5000,
        isPartitioned: false,
      };

      mockPrisma.vehicle.findUnique.mockResolvedValue(mockVehicle);

      const result = await service.validateTripWeight(1000, 'vehicle-1', [
        'CHEMICAL',
        'HAZARDOUS',
      ]);

      expect(result.canAssign).toBe(false);
      expect(result.cargoCompatibility).toBe('INCOMPATIBLE');
      expect(result.reason).toContain('Chemical and hazardous materials cannot be transported together');
    });

    it('should require partitioned vehicle for Heavy + Fragile', async () => {
      const mockVehicle = {
        id: 'vehicle-1',
        capacityKg: 5000,
        isPartitioned: false,
      };

      mockPrisma.vehicle.findUnique.mockResolvedValue(mockVehicle);

      const result = await service.validateTripWeight(1000, 'vehicle-1', [
        'HEAVY',
        'FRAGILE',
      ]);

      expect(result.canAssign).toBe(false);
      expect(result.requiresPartitionedVehicle).toBe(true);
      expect(result.reason).toContain('partitioned vehicle');
    });

    it('should allow Heavy + Fragile with partitioned vehicle', async () => {
      const mockVehicle = {
        id: 'vehicle-1',
        capacityKg: 5000,
        isPartitioned: true,
      };

      mockPrisma.vehicle.findUnique.mockResolvedValue(mockVehicle);

      const result = await service.validateTripWeight(1000, 'vehicle-1', [
        'HEAVY',
        'FRAGILE',
      ]);

      expect(result.canAssign).toBe(true);
      expect(result.requiresPartitionedVehicle).toBe(true);
    });

    it('should require partitioned vehicle for Fragile + Chemical', async () => {
      const mockVehicle = {
        id: 'vehicle-1',
        capacityKg: 5000,
        isPartitioned: false,
      };

      mockPrisma.vehicle.findUnique.mockResolvedValue(mockVehicle);

      const result = await service.validateTripWeight(1000, 'vehicle-1', [
        'FRAGILE',
        'CHEMICAL',
      ]);

      expect(result.canAssign).toBe(false);
      expect(result.requiresPartitionedVehicle).toBe(true);
    });

    it('should calculate utilization percentage correctly', async () => {
      const mockVehicle = {
        id: 'vehicle-1',
        capacityKg: 10000,
        isPartitioned: false,
      };

      mockPrisma.vehicle.findUnique.mockResolvedValue(mockVehicle);

      const result = await service.validateTripWeight(2500, 'vehicle-1', []);

      expect(result.utilization).toBe(0.25);
      expect(result.status).toBe(WeightStatus.SAFE);
    });
  });

  describe('createWeightRecord', () => {
    it('should create SAFE record for <= 70% utilization', async () => {
      const mockRecord = {
        id: 'record-1',
        tripId: 'trip-1',
        orderId: 'order-1',
        cargoWeight: 3500,
        vehicleCapacity: 5000,
        utilization: 0.7,
        status: WeightStatus.SAFE,
      };

      mockPrisma.weightRecord.create.mockResolvedValue(mockRecord);

      const result = await service.createWeightRecord('trip-1', 'order-1', 3500, 5000);

      expect(result.status).toBe(WeightStatus.SAFE);
      expect(result.utilization).toBe(0.7);
      expect(mockPrisma.weightRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tripId: 'trip-1',
            orderId: 'order-1',
            cargoWeight: 3500,
            vehicleCapacity: 5000,
            utilization: 0.7,
            status: WeightStatus.SAFE,
          }),
        }),
      );
    });

    it('should create WARNING record for 85% utilization', async () => {
      mockPrisma.weightRecord.create.mockResolvedValue({
        id: 'record-1',
        status: WeightStatus.WARNING,
        utilization: 0.85,
      });

      const result = await service.createWeightRecord('trip-1', 'order-1', 4250, 5000);

      expect(result.status).toBe(WeightStatus.WARNING);
    });

    it('should create NEAR_CAPACITY record for 94% utilization', async () => {
      mockPrisma.weightRecord.create.mockResolvedValue({
        id: 'record-1',
        status: WeightStatus.NEAR_CAPACITY,
        utilization: 0.94,
      });

      const result = await service.createWeightRecord('trip-1', 'order-1', 4700, 5000);

      expect(result.status).toBe(WeightStatus.NEAR_CAPACITY);
    });

    it('should create OVERLOADED record for > 94% utilization', async () => {
      mockPrisma.weightRecord.create.mockResolvedValue({
        id: 'record-1',
        status: WeightStatus.OVERLOADED,
        utilization: 0.95,
      });

      const result = await service.createWeightRecord('trip-1', 'order-1', 4750, 5000);

      expect(result.status).toBe(WeightStatus.OVERLOADED);
    });
  });

  describe('getWeightAlerts', () => {
    it('should query records with utilization above 0.7 and recalculate status', async () => {
      const mockAlerts = [
        { id: '1', status: WeightStatus.WARNING, utilization: 0.85 },
        { id: '2', status: WeightStatus.NEAR_CAPACITY, utilization: 0.98 },
        { id: '3', status: WeightStatus.OVERLOADED, utilization: 1.1 },
      ];

      mockPrisma.weightRecord.findMany.mockResolvedValue(mockAlerts);

      const result = await service.getWeightAlerts();

      expect(result).toHaveLength(3);
      expect(result[0].status).toBe(WeightStatus.WARNING);
      expect(result[1].status).toBe(WeightStatus.OVERLOADED);
      expect(result[2].status).toBe(WeightStatus.OVERLOADED);
      expect(mockPrisma.weightRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            utilization: { gt: 0.7 },
          },
          orderBy: { checkedAt: 'desc' },
          take: 50,
        }),
      );
    });

    it('should upgrade old NEAR_CAPACITY records to OVERLOADED when utilization > 94%', async () => {
      const mockAlerts = [
        { id: '1', status: WeightStatus.NEAR_CAPACITY, utilization: 1.44 },
        { id: '2', status: WeightStatus.NEAR_CAPACITY, utilization: 1.1 },
      ];

      mockPrisma.weightRecord.findMany.mockResolvedValue(mockAlerts);

      const result = await service.getWeightAlerts();

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe(WeightStatus.OVERLOADED);
      expect(result[1].status).toBe(WeightStatus.OVERLOADED);
    });

    it('should filter out records that are now SAFE after recalculation', async () => {
      const mockAlerts = [
        { id: '1', status: WeightStatus.WARNING, utilization: 0.65 },
        { id: '2', status: WeightStatus.WARNING, utilization: 0.85 },
      ];

      mockPrisma.weightRecord.findMany.mockResolvedValue(mockAlerts);

      const result = await service.getWeightAlerts();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
      expect(result[0].status).toBe(WeightStatus.WARNING);
    });

    it('should include trip details in alerts', async () => {
      const mockAlerts = [
        {
          id: '1',
          status: WeightStatus.WARNING,
          utilization: 0.85,
          trip: {
            order: { orderNumber: 'IN-ORD-2024-000001' },
            driver: { user: { firstName: 'John', lastName: 'Doe' } },
            vehicle: { plateNumber: 'ABC123' },
          },
        },
      ];

      mockPrisma.weightRecord.findMany.mockResolvedValue(mockAlerts);

      const result = await service.getWeightAlerts();

      expect(result[0]?.trip?.order?.orderNumber).toBe('IN-ORD-2024-000001');
      expect(result[0]?.trip?.driver?.user?.firstName).toBe('John');
    });
  });
});
