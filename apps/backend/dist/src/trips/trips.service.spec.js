"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const trips_service_1 = require("./trips.service");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const weight_watch_service_1 = require("../weight-watch/weight-watch.service");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
describe('TripsService', () => {
    let service;
    let prisma;
    let weightWatchService;
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
    const mockWeightWatchService = {
        validateTripWeight: jest.fn(),
        createWeightRecord: jest.fn(),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                trips_service_1.TripsService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrisma },
                { provide: audit_service_1.AuditService, useValue: mockAuditService },
                { provide: weight_watch_service_1.WeightWatchService, useValue: mockWeightWatchService },
            ],
        }).compile();
        service = module.get(trips_service_1.TripsService);
        prisma = module.get(prisma_service_1.PrismaService);
        weightWatchService = module.get(weight_watch_service_1.WeightWatchService);
        jest.clearAllMocks();
    });
    describe('create', () => {
        it('should create trip with driver and vehicle assignment', async () => {
            const mockOrder = {
                id: 'order-1',
                status: client_1.OrderStatus.DISPATCH_READY,
                totalWeight: 1000,
                handlingTags: [],
                trip: null,
            };
            const mockDriver = {
                id: 'driver-1',
                availability: client_1.DriverAvailability.AVAILABLE,
            };
            const mockVehicle = {
                id: 'vehicle-1',
                capacityKg: 5000,
                status: client_1.VehicleStatus.ACTIVE,
            };
            const mockTrip = {
                id: 'trip-1',
                orderId: 'order-1',
                driverId: 'driver-1',
                vehicleId: 'vehicle-1',
                status: client_1.TripStatus.ASSIGNED,
            };
            mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
            mockPrisma.driver.findUnique.mockResolvedValue(mockDriver);
            mockPrisma.vehicle.findUnique.mockResolvedValue(mockVehicle);
            mockWeightWatchService.validateTripWeight.mockResolvedValue({ canAssign: true });
            mockPrisma.trip.create.mockResolvedValue(mockTrip);
            const result = await service.create({ orderId: 'order-1', driverId: 'driver-1', vehicleId: 'vehicle-1' }, 'admin-id');
            expect(result.driverId).toBe('driver-1');
            expect(result.vehicleId).toBe('vehicle-1');
            expect(mockPrisma.driver.update).toHaveBeenCalledWith(expect.objectContaining({
                data: { availability: client_1.DriverAvailability.ON_TRIP },
            }));
            expect(mockPrisma.driverAssignment.create).toHaveBeenCalled();
            expect(mockAuditService.log).toHaveBeenCalled();
        });
        it('should throw NotFoundException when order not found', async () => {
            mockPrisma.order.findUnique.mockResolvedValue(null);
            await expect(service.create({ orderId: 'non-existent', driverId: 'driver-1', vehicleId: 'vehicle-1' }, 'admin-id')).rejects.toThrow(common_1.NotFoundException);
        });
        it('should throw BadRequestException when order already has trip', async () => {
            const mockOrder = {
                id: 'order-1',
                trip: { id: 'existing-trip' },
            };
            mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
            await expect(service.create({ orderId: 'order-1', driverId: 'driver-1', vehicleId: 'vehicle-1' }, 'admin-id')).rejects.toThrow(common_1.BadRequestException);
        });
        it('should throw BadRequestException when order not DISPATCH_READY', async () => {
            const mockOrder = {
                id: 'order-1',
                status: client_1.OrderStatus.DRAFT,
                trip: null,
            };
            mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
            await expect(service.create({ orderId: 'order-1', driverId: 'driver-1', vehicleId: 'vehicle-1' }, 'admin-id')).rejects.toThrow(common_1.BadRequestException);
        });
        it('should throw BadRequestException when driver not available', async () => {
            const mockOrder = {
                id: 'order-1',
                status: client_1.OrderStatus.DISPATCH_READY,
                handlingTags: [],
                trip: null,
            };
            const mockDriver = {
                id: 'driver-1',
                availability: client_1.DriverAvailability.ON_TRIP,
            };
            mockPrisma.order.findUnique.mockResolvedValue(mockOrder);
            mockPrisma.driver.findUnique.mockResolvedValue(mockDriver);
            await expect(service.create({ orderId: 'order-1', driverId: 'driver-1', vehicleId: 'vehicle-1' }, 'admin-id')).rejects.toThrow(common_1.BadRequestException);
        });
        it('should prevent assignment when weight validation fails', async () => {
            const mockOrder = {
                id: 'order-1',
                status: client_1.OrderStatus.DISPATCH_READY,
                totalWeight: 10000,
                handlingTags: [],
                trip: null,
            };
            const mockDriver = {
                id: 'driver-1',
                availability: client_1.DriverAvailability.AVAILABLE,
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
            await expect(service.create({ orderId: 'order-1', driverId: 'driver-1', vehicleId: 'vehicle-1' }, 'admin-id')).rejects.toThrow(common_1.BadRequestException);
        });
    });
    describe('findAll', () => {
        it('should return paginated trips with filters', async () => {
            const mockTrips = [
                { id: 'trip-1', status: client_1.TripStatus.ASSIGNED, driverId: 'driver-1' },
                { id: 'trip-2', status: client_1.TripStatus.IN_TRANSIT, driverId: 'driver-1' },
            ];
            mockPrisma.trip.findMany.mockResolvedValue(mockTrips);
            mockPrisma.trip.count.mockResolvedValue(2);
            const result = await service.findAll({ driverId: 'driver-1' });
            expect(result.data).toHaveLength(2);
            expect(result.meta.total).toBe(2);
            expect(mockPrisma.trip.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ driverId: 'driver-1' }),
            }));
        });
        it('should filter by status', async () => {
            mockPrisma.trip.findMany.mockResolvedValue([]);
            mockPrisma.trip.count.mockResolvedValue(0);
            await service.findAll({ status: client_1.TripStatus.IN_TRANSIT });
            expect(mockPrisma.trip.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ status: client_1.TripStatus.IN_TRANSIT }),
            }));
        });
    });
    describe('startTrip', () => {
        it('should update trip status to IN_TRANSIT', async () => {
            const mockTrip = {
                id: 'trip-1',
                status: client_1.TripStatus.ASSIGNED,
            };
            mockPrisma.trip.findUnique.mockResolvedValue(mockTrip);
            mockPrisma.trip.update.mockResolvedValue({ ...mockTrip, status: client_1.TripStatus.IN_TRANSIT });
            const result = await service.startTrip('trip-1', 'driver-id');
            expect(result.status).toBe(client_1.TripStatus.IN_TRANSIT);
            expect(mockAuditService.log).toHaveBeenCalled();
        });
        it('should throw BadRequestException when trip not in ASSIGNED status', async () => {
            const mockTrip = {
                id: 'trip-1',
                status: client_1.TripStatus.DELIVERED,
            };
            mockPrisma.trip.findUnique.mockResolvedValue(mockTrip);
            await expect(service.startTrip('trip-1', 'driver-id')).rejects.toThrow(common_1.BadRequestException);
        });
    });
    describe('completeTrip', () => {
        it('should complete trip and free driver', async () => {
            const mockTrip = {
                id: 'trip-1',
                status: client_1.TripStatus.IN_TRANSIT,
                driverId: 'driver-1',
                orderId: 'order-1',
            };
            mockPrisma.trip.findUnique.mockResolvedValue(mockTrip);
            mockPrisma.trip.update.mockResolvedValue({ ...mockTrip, status: client_1.TripStatus.DELIVERED });
            const result = await service.completeTrip('trip-1', 'driver-id');
            expect(result.status).toBe(client_1.TripStatus.DELIVERED);
            expect(mockPrisma.driver.update).toHaveBeenCalledWith(expect.objectContaining({
                data: { availability: client_1.DriverAvailability.AVAILABLE },
            }));
        });
    });
});
//# sourceMappingURL=trips.service.spec.js.map