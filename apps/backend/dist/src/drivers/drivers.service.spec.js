"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const drivers_service_1 = require("./drivers.service");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
describe('DriversService', () => {
    let service;
    let prisma;
    const mockPrisma = {
        user: {
            findUnique: jest.fn(),
        },
        driver: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
        },
        vehicle: {
            findUnique: jest.fn(),
        },
    };
    const mockAuditService = {
        log: jest.fn(),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                drivers_service_1.DriversService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrisma },
                { provide: audit_service_1.AuditService, useValue: mockAuditService },
            ],
        }).compile();
        service = module.get(drivers_service_1.DriversService);
        prisma = module.get(prisma_service_1.PrismaService);
        jest.clearAllMocks();
    });
    describe('create', () => {
        it('should create driver profile and log audit', async () => {
            const mockUser = {
                id: 'user-1',
                email: 'driver@example.com',
                driver: null,
            };
            const mockDriver = {
                id: 'driver-1',
                userId: 'user-1',
                licenseNumber: 'DL123456',
                kycStatus: client_1.KycStatus.PENDING,
                status: client_1.DriverStatus.ACTIVE,
                availability: client_1.DriverAvailability.AVAILABLE,
            };
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);
            mockPrisma.driver.create.mockResolvedValue(mockDriver);
            const result = await service.create({ userId: 'user-1', licenseNumber: 'DL123456' }, 'admin-id');
            expect(result.licenseNumber).toBe('DL123456');
            expect(result.kycStatus).toBe(client_1.KycStatus.PENDING);
            expect(result.availability).toBe(client_1.DriverAvailability.AVAILABLE);
            expect(mockAuditService.log).toHaveBeenCalled();
        });
        it('should throw NotFoundException when user not found', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);
            await expect(service.create({ userId: 'non-existent', licenseNumber: 'DL123' }, 'admin-id')).rejects.toThrow(common_1.NotFoundException);
        });
        it('should throw ConflictException when user already has driver profile', async () => {
            const mockUser = {
                id: 'user-1',
                driver: { id: 'existing-driver' },
            };
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);
            await expect(service.create({ userId: 'user-1', licenseNumber: 'DL123' }, 'admin-id')).rejects.toThrow(common_1.ConflictException);
        });
        it('should verify vehicle exists when vehicleId provided', async () => {
            const mockUser = { id: 'user-1', driver: null };
            const mockVehicle = { id: 'vehicle-1', plateNumber: 'ABC123' };
            const mockDriver = {
                id: 'driver-1',
                userId: 'user-1',
                licenseNumber: 'DL123',
                vehicleId: 'vehicle-1',
            };
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);
            mockPrisma.vehicle.findUnique.mockResolvedValue(mockVehicle);
            mockPrisma.driver.create.mockResolvedValue(mockDriver);
            const result = await service.create({ userId: 'user-1', licenseNumber: 'DL123', vehicleId: 'vehicle-1' }, 'admin-id');
            expect(result.vehicleId).toBe('vehicle-1');
            expect(mockPrisma.vehicle.findUnique).toHaveBeenCalledWith({
                where: { id: 'vehicle-1' },
            });
        });
    });
    describe('update', () => {
        it('should update driver KYC status', async () => {
            const mockDriver = {
                id: 'driver-1',
                kycStatus: client_1.KycStatus.PENDING,
                status: client_1.DriverStatus.ACTIVE,
            };
            mockPrisma.driver.findUnique.mockResolvedValue(mockDriver);
            mockPrisma.driver.update.mockResolvedValue({ ...mockDriver, kycStatus: client_1.KycStatus.VERIFIED });
            const result = await service.update('driver-1', { kycStatus: client_1.KycStatus.VERIFIED }, 'admin-id');
            expect(result.kycStatus).toBe(client_1.KycStatus.VERIFIED);
            expect(mockAuditService.log).toHaveBeenCalled();
        });
        it('should update driver availability', async () => {
            const mockDriver = {
                id: 'driver-1',
                availability: client_1.DriverAvailability.AVAILABLE,
            };
            mockPrisma.driver.findUnique.mockResolvedValue(mockDriver);
            mockPrisma.driver.update.mockResolvedValue({ ...mockDriver, availability: client_1.DriverAvailability.OFF_DUTY });
            const result = await service.update('driver-1', { availability: client_1.DriverAvailability.OFF_DUTY }, 'admin-id');
            expect(result.availability).toBe(client_1.DriverAvailability.OFF_DUTY);
        });
        it('should throw NotFoundException when driver not found', async () => {
            mockPrisma.driver.findUnique.mockResolvedValue(null);
            await expect(service.update('non-existent', {}, 'admin-id')).rejects.toThrow(common_1.NotFoundException);
        });
    });
    describe('findAll', () => {
        it('should return paginated drivers with filters', async () => {
            const mockDrivers = [
                { id: 'driver-1', status: client_1.DriverStatus.ACTIVE, availability: client_1.DriverAvailability.AVAILABLE },
                { id: 'driver-2', status: client_1.DriverStatus.ACTIVE, availability: client_1.DriverAvailability.ON_TRIP },
            ];
            mockPrisma.driver.findMany.mockResolvedValue(mockDrivers);
            mockPrisma.driver.count.mockResolvedValue(2);
            const result = await service.findAll({ status: client_1.DriverStatus.ACTIVE, availability: client_1.DriverAvailability.AVAILABLE });
            expect(result.data).toHaveLength(2);
            expect(result.meta.total).toBe(2);
            expect(mockPrisma.driver.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    status: client_1.DriverStatus.ACTIVE,
                    availability: client_1.DriverAvailability.AVAILABLE,
                }),
            }));
        });
        it('should filter by KYC status', async () => {
            mockPrisma.driver.findMany.mockResolvedValue([]);
            mockPrisma.driver.count.mockResolvedValue(0);
            await service.findAll({ kycStatus: client_1.KycStatus.VERIFIED });
            expect(mockPrisma.driver.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ kycStatus: client_1.KycStatus.VERIFIED }),
            }));
        });
    });
    describe('deactivate', () => {
        it('should set driver status to INACTIVE', async () => {
            const mockDriver = {
                id: 'driver-1',
                status: client_1.DriverStatus.ACTIVE,
                availability: client_1.DriverAvailability.AVAILABLE,
            };
            mockPrisma.driver.findUnique.mockResolvedValue(mockDriver);
            mockPrisma.driver.update.mockResolvedValue({
                ...mockDriver,
                status: client_1.DriverStatus.INACTIVE,
                availability: client_1.DriverAvailability.OFF_DUTY
            });
            await service.deactivate('driver-1', 'admin-id');
            expect(mockPrisma.driver.update).toHaveBeenCalledWith(expect.objectContaining({
                data: { status: client_1.DriverStatus.INACTIVE, availability: client_1.DriverAvailability.OFF_DUTY },
            }));
        });
        it('should throw BadRequestException if driver is on trip', async () => {
            const mockDriver = {
                id: 'driver-1',
                status: client_1.DriverStatus.ACTIVE,
                availability: client_1.DriverAvailability.ON_TRIP,
            };
            mockPrisma.driver.findUnique.mockResolvedValue(mockDriver);
            await expect(service.deactivate('driver-1', 'admin-id')).rejects.toThrow(common_1.BadRequestException);
        });
    });
});
//# sourceMappingURL=drivers.service.spec.js.map