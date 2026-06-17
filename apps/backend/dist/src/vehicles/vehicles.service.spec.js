"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const vehicles_service_1 = require("./vehicles.service");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
describe('VehiclesService', () => {
    let service;
    let prisma;
    const mockPrisma = {
        vehicle: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
        },
    };
    const mockAuditService = {
        log: jest.fn(),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                vehicles_service_1.VehiclesService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrisma },
                { provide: audit_service_1.AuditService, useValue: mockAuditService },
            ],
        }).compile();
        service = module.get(vehicles_service_1.VehiclesService);
        prisma = module.get(prisma_service_1.PrismaService);
        jest.clearAllMocks();
    });
    describe('create', () => {
        it('should create vehicle and log audit', async () => {
            const createVehicleDto = {
                plateNumber: 'ABC123',
                category: client_1.VehicleCategory.HEAVY,
                capacityKg: 5000,
            };
            const mockVehicle = {
                id: 'vehicle-1',
                ...createVehicleDto,
                status: client_1.VehicleStatus.ACTIVE,
                isPartitioned: false,
            };
            mockPrisma.vehicle.findUnique.mockResolvedValue(null);
            mockPrisma.vehicle.create.mockResolvedValue(mockVehicle);
            const result = await service.create(createVehicleDto, 'admin-id');
            expect(result.plateNumber).toBe('ABC123');
            expect(result.capacityKg).toBe(5000);
            expect(result.status).toBe(client_1.VehicleStatus.ACTIVE);
            expect(mockAuditService.log).toHaveBeenCalled();
        });
        it('should throw ConflictException for duplicate plate number', async () => {
            mockPrisma.vehicle.findUnique.mockResolvedValue({ id: 'existing-vehicle' });
            await expect(service.create({ plateNumber: 'ABC123', category: client_1.VehicleCategory.HEAVY, capacityKg: 5000 }, 'admin-id')).rejects.toThrow(common_1.ConflictException);
        });
        it('should set default status to ACTIVE if not provided', async () => {
            const createVehicleDto = {
                plateNumber: 'XYZ789',
                category: client_1.VehicleCategory.MEDIUM,
                capacityKg: 1500,
            };
            mockPrisma.vehicle.findUnique.mockResolvedValue(null);
            mockPrisma.vehicle.create.mockResolvedValue({
                id: 'vehicle-2',
                ...createVehicleDto,
                status: client_1.VehicleStatus.ACTIVE,
            });
            const result = await service.create(createVehicleDto, 'admin-id');
            expect(result.status).toBe(client_1.VehicleStatus.ACTIVE);
        });
    });
    describe('update', () => {
        it('should update vehicle capacity', async () => {
            const mockVehicle = {
                id: 'vehicle-1',
                plateNumber: 'ABC123',
                capacityKg: 5000,
            };
            mockPrisma.vehicle.findUnique.mockResolvedValue(mockVehicle);
            mockPrisma.vehicle.update.mockResolvedValue({ ...mockVehicle, capacityKg: 6000 });
            const result = await service.update('vehicle-1', { capacityKg: 6000 }, 'admin-id');
            expect(result.capacityKg).toBe(6000);
            expect(mockAuditService.log).toHaveBeenCalled();
        });
        it('should update vehicle status', async () => {
            const mockVehicle = {
                id: 'vehicle-1',
                status: client_1.VehicleStatus.ACTIVE,
            };
            mockPrisma.vehicle.findUnique.mockResolvedValue(mockVehicle);
            mockPrisma.vehicle.update.mockResolvedValue({ ...mockVehicle, status: client_1.VehicleStatus.MAINTENANCE });
            const result = await service.update('vehicle-1', { status: client_1.VehicleStatus.MAINTENANCE }, 'admin-id');
            expect(result.status).toBe(client_1.VehicleStatus.MAINTENANCE);
        });
        it('should throw NotFoundException when vehicle not found', async () => {
            mockPrisma.vehicle.findUnique.mockResolvedValue(null);
            await expect(service.update('non-existent', {}, 'admin-id')).rejects.toThrow(common_1.NotFoundException);
        });
    });
    describe('findAll', () => {
        it('should return paginated vehicles with filters', async () => {
            const mockVehicles = [
                { id: 'vehicle-1', status: client_1.VehicleStatus.ACTIVE, category: client_1.VehicleCategory.HEAVY },
                { id: 'vehicle-2', status: client_1.VehicleStatus.ACTIVE, category: client_1.VehicleCategory.MEDIUM },
            ];
            mockPrisma.vehicle.findMany.mockResolvedValue(mockVehicles);
            mockPrisma.vehicle.count.mockResolvedValue(2);
            const result = await service.findAll({ status: client_1.VehicleStatus.ACTIVE });
            expect(result.data).toHaveLength(2);
            expect(result.meta.total).toBe(2);
            expect(mockPrisma.vehicle.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ status: client_1.VehicleStatus.ACTIVE }),
            }));
        });
        it('should filter by category', async () => {
            mockPrisma.vehicle.findMany.mockResolvedValue([]);
            mockPrisma.vehicle.count.mockResolvedValue(0);
            await service.findAll({ category: client_1.VehicleCategory.HEAVY });
            expect(mockPrisma.vehicle.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({ category: client_1.VehicleCategory.HEAVY }),
            }));
        });
        it('should search by plate number', async () => {
            mockPrisma.vehicle.findMany.mockResolvedValue([]);
            mockPrisma.vehicle.count.mockResolvedValue(0);
            await service.findAll({ search: 'ABC' });
            expect(mockPrisma.vehicle.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    plateNumber: expect.objectContaining({ contains: 'ABC' }),
                }),
            }));
        });
    });
    describe('deactivate', () => {
        it('should set vehicle status to INACTIVE', async () => {
            const mockVehicle = {
                id: 'vehicle-1',
                status: client_1.VehicleStatus.ACTIVE,
            };
            mockPrisma.vehicle.findUnique.mockResolvedValue(mockVehicle);
            mockPrisma.vehicle.update.mockResolvedValue({ ...mockVehicle, status: client_1.VehicleStatus.INACTIVE });
            await service.deactivate('vehicle-1', 'admin-id');
            expect(mockPrisma.vehicle.update).toHaveBeenCalledWith(expect.objectContaining({
                data: { status: client_1.VehicleStatus.INACTIVE },
            }));
        });
    });
});
//# sourceMappingURL=vehicles.service.spec.js.map