import { Test, TestingModule } from '@nestjs/testing';
import { TripsService } from './trips.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { WeightWatchService } from '../weight-watch/weight-watch.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TripStatus, OrderStatus, DriverAvailability, DriverStatus, VehicleStatus } from '@prisma/client';
import { ValhallaService } from '../maps/valhalla.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('TripsService', () => {
  let service: TripsService;
  let prisma: PrismaService;
  let weightWatchService: WeightWatchService;
  let mockValhalla: any;

  const mockPrisma = {
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    driver: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    vehicle: {
      findUnique: jest.fn(),
    },
    trip: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    driverAssignment: {
      create: jest.fn(),
    },
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  const mockNotificationsService = {
    notifyTripAssigned: jest.fn(),
    notifyTripStarted: jest.fn(),
    notifyTripCompleted: jest.fn(),
    notifyDriverAssigned: jest.fn(),
  };

  const mockWeightWatchService = {
    validateTripWeight: jest.fn(),
    createWeightRecord: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAuditService },
        { provide: WeightWatchService, useValue: mockWeightWatchService },
        { provide: ValhallaService, useValue: { getEta: jest.fn() } },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<TripsService>(TripsService);
    prisma = module.get<PrismaService>(PrismaService);
    weightWatchService = module.get<WeightWatchService>(WeightWatchService);
    // retrieve mock valhalla service
    mockValhalla = module.get<ValhallaService>(ValhallaService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create trip with driver and vehicle assignment', async () => {
      const mockOrder = {
        id: 'order-1',
        status: OrderStatus.DISPATCH_READY,
        totalWeight: 1000,
        handlingTags: [],
        trip: null,
      };

      const mockDriver = {
        id: 'driver-1',
        availability: DriverAvailability.AVAILABLE,
      };

      const mockVehicle = {
        id: 'vehicle-1',
        capacityKg: 5000,
        status: VehicleStatus.ACTIVE,
      };

      const mockTrip = {
        id: 'trip-1',
        orderId: 'order-1',
        driverId: 'driver-1',
        vehicleId: 'vehicle-1',
        status: TripStatus.ASSIGNED,
      };

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.driver.findUnique.mockResolvedValue(mockDriver);
      mockPrisma.vehicle.findUnique.mockResolvedValue(mockVehicle);
      mockWeightWatchService.validateTripWeight.mockResolvedValue({ canAssign: true });
      mockPrisma.trip.create.mockResolvedValue(mockTrip);

      const result = await service.create(
        { orderId: 'order-1', driverId: 'driver-1', vehicleId: 'vehicle-1' },
        'admin-id',
      );

      expect(result.driverId).toBe('driver-1');
      expect(result.vehicleId).toBe('vehicle-1');
      expect(mockPrisma.driver.update).toHaveBeenCalled();
      const calledArg = mockPrisma.driver.update.mock.calls[0][0];
      expect(calledArg.data.availability).toBe(DriverAvailability.ON_TRIP);
      expect(mockPrisma.driverAssignment.create).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('should throw NotFoundException when order not found', async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(
        service.create({ orderId: 'non-existent', driverId: 'driver-1', vehicleId: 'vehicle-1' }, 'admin-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when order already has trip', async () => {
      const mockOrder = {
        id: 'order-1',
        trip: { id: 'existing-trip' },
      };

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      await expect(
        service.create({ orderId: 'order-1', driverId: 'driver-1', vehicleId: 'vehicle-1' }, 'admin-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when order not DISPATCH_READY', async () => {
      const mockOrder = {
        id: 'order-1',
        status: OrderStatus.DRAFT,
        trip: null,
      };

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      await expect(
        service.create({ orderId: 'order-1', driverId: 'driver-1', vehicleId: 'vehicle-1' }, 'admin-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when driver not available', async () => {
      const mockOrder = {
        id: 'order-1',
        status: OrderStatus.DISPATCH_READY,
        handlingTags: [],
        trip: null,
      };

      const mockDriver = {
        id: 'driver-1',
        availability: DriverAvailability.ON_TRIP,
      };

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.driver.findUnique.mockResolvedValue(mockDriver);

      await expect(
        service.create({ orderId: 'order-1', driverId: 'driver-1', vehicleId: 'vehicle-1' }, 'admin-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should prevent assignment when weight validation fails', async () => {
      const mockOrder = {
        id: 'order-1',
        status: OrderStatus.DISPATCH_READY,
        totalWeight: 10000,
        handlingTags: [],
        trip: null,
      };

      const mockDriver = {
        id: 'driver-1',
        availability: DriverAvailability.AVAILABLE,
      };

      const mockVehicle = {
        id: 'vehicle-1',
        capacityKg: 5000,
      };

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
      mockPrisma.driver.findUnique.mockResolvedValue(mockDriver);
      mockPrisma.vehicle.findUnique.mockResolvedValue(mockVehicle);
      mockWeightWatchService.validateTripWeight.mockResolvedValue({
        canAssign: false,
        reason: 'Order weight exceeds vehicle capacity',
      });

      await expect(
        service.create({ orderId: 'order-1', driverId: 'driver-1', vehicleId: 'vehicle-1' }, 'admin-id'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated trips with filters', async () => {
      const mockTrips = [
        { id: 'trip-1', status: TripStatus.ASSIGNED, driverId: 'driver-1' },
        { id: 'trip-2', status: TripStatus.IN_TRANSIT, driverId: 'driver-1' },
      ];

      mockPrisma.trip.findMany.mockResolvedValue(mockTrips);
      mockPrisma.trip.count.mockResolvedValue(2);

      const result = await service.findAll({ driverId: 'driver-1' });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(mockPrisma.trip.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ driverId: 'driver-1' }),
        }),
      );
    });

    it('should filter by status', async () => {
      mockPrisma.trip.findMany.mockResolvedValue([]);
      mockPrisma.trip.count.mockResolvedValue(0);

      await service.findAll({ status: TripStatus.IN_TRANSIT });

      expect(mockPrisma.trip.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: TripStatus.IN_TRANSIT }),
        }),
      );
    });
  });

  describe('startTrip', () => {
    it('should update trip status to IN_TRANSIT', async () => {
      const mockTrip = {
        id: 'trip-1',
        status: TripStatus.ASSIGNED,
        order: {
          id: 'order-1',
          pickupLocation: { lat: 1, lng: 1 },
          deliveryLocation: { lat: 2, lng: 2 },
          clientId: 'client-1',
          orderNumber: 'ORD-1',
        },
        driver: { user: { id: 'driver-user-1' } },
        orderId: 'order-1',
      };

      mockPrisma.trip.findUnique.mockResolvedValue(mockTrip);
      // Mock valhalla to return 3600 seconds
      mockValhalla.getEta.mockResolvedValue(3600);
      // Expect prisma.update to return trip with eta
      const returned = { ...mockTrip, status: TripStatus.IN_TRANSIT, eta: new Date(Date.now() + 3600 * 1000) };
      mockPrisma.trip.update.mockResolvedValue(returned);

      const result = await service.startTrip('trip-1', 'driver-id');

      expect(result.status).toBe(TripStatus.IN_TRANSIT);
      expect(result.eta).toBeDefined();
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('should throw BadRequestException when trip not in ASSIGNED status', async () => {
      const mockTrip = {
        id: 'trip-1',
        status: TripStatus.DELIVERED,
      };

      mockPrisma.trip.findUnique.mockResolvedValue(mockTrip);

      await expect(service.startTrip('trip-1', 'driver-id')).rejects.toThrow(BadRequestException);
    });
  });

  describe('completeTrip', () => {
    it('should complete trip and free driver', async () => {
      const mockTrip = {
        id: 'trip-1',
        status: TripStatus.IN_TRANSIT,
        driverId: 'driver-1',
        orderId: 'order-1',
      };

      mockPrisma.trip.findUnique.mockResolvedValue(mockTrip);
      mockPrisma.trip.update.mockResolvedValue({ ...mockTrip, status: TripStatus.DELIVERED });

      const result = await service.completeTrip('trip-1', 'driver-id');

      expect(result.status).toBe(TripStatus.DELIVERED);
      expect(mockPrisma.driver.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { availability: DriverAvailability.AVAILABLE },
        }),
      );
    });
  });
});
