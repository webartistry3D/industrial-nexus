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
exports.VehiclesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const client_1 = require("@prisma/client");
let VehiclesService = class VehiclesService {
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async create(createVehicleDto, userId) {
        const existingVehicle = await this.prisma.vehicle.findUnique({
            where: { plateNumber: createVehicleDto.plateNumber },
        });
        if (existingVehicle) {
            throw new common_1.ConflictException('Vehicle with this plate number already exists');
        }
        const vehicle = await this.prisma.vehicle.create({
            data: {
                plateNumber: createVehicleDto.plateNumber,
                category: createVehicleDto.category,
                capacityKg: createVehicleDto.capacityKg,
                status: createVehicleDto.status || client_1.VehicleStatus.ACTIVE,
                isPartitioned: createVehicleDto.isPartitioned || false,
            },
        });
        await this.auditService.log({
            userId,
            action: 'CREATE',
            entityType: 'VEHICLE',
            entityId: vehicle.id,
            newValue: { plateNumber: vehicle.plateNumber, category: vehicle.category },
        });
        return vehicle;
    }
    async findAll(filterDto) {
        const { page = 1, limit = 10, status, category, search } = filterDto;
        const skip = (page - 1) * limit;
        const where = {};
        if (status)
            where.status = status;
        if (category)
            where.category = category;
        if (search) {
            where.plateNumber = { contains: search, mode: 'insensitive' };
        }
        const [vehicles, total] = await Promise.all([
            this.prisma.vehicle.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    drivers: {
                        where: { status: 'ACTIVE' },
                        select: {
                            id: true,
                            user: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                },
                            },
                        },
                    },
                    _count: {
                        select: { trips: true },
                    },
                },
            }),
            this.prisma.vehicle.count({ where }),
        ]);
        return {
            data: vehicles,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(id) {
        const vehicle = await this.prisma.vehicle.findUnique({
            where: { id },
            include: {
                drivers: {
                    where: { status: 'ACTIVE' },
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                phoneNumber: true,
                            },
                        },
                    },
                },
                trips: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    include: {
                        order: {
                            select: {
                                orderNumber: true,
                                status: true,
                            },
                        },
                        driver: {
                            include: {
                                user: {
                                    select: {
                                        firstName: true,
                                        lastName: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!vehicle) {
            throw new common_1.NotFoundException('Vehicle not found');
        }
        return vehicle;
    }
    async update(id, updateVehicleDto, userId) {
        const existingVehicle = await this.findOne(id);
        const updateData = {};
        if (updateVehicleDto.plateNumber !== undefined)
            updateData.plateNumber = updateVehicleDto.plateNumber;
        if (updateVehicleDto.category !== undefined)
            updateData.category = updateVehicleDto.category;
        if (updateVehicleDto.capacityKg !== undefined)
            updateData.capacityKg = updateVehicleDto.capacityKg;
        if (updateVehicleDto.status !== undefined)
            updateData.status = updateVehicleDto.status;
        if (updateVehicleDto.isPartitioned !== undefined)
            updateData.isPartitioned = updateVehicleDto.isPartitioned;
        const vehicle = await this.prisma.vehicle.update({
            where: { id },
            data: updateData,
        });
        await this.auditService.log({
            userId,
            action: 'UPDATE',
            entityType: 'VEHICLE',
            entityId: id,
            oldValue: { ...existingVehicle },
            newValue: updateData,
        });
        return vehicle;
    }
    async deactivate(id, userId) {
        return this.update(id, { status: client_1.VehicleStatus.INACTIVE }, userId);
    }
};
exports.VehiclesService = VehiclesService;
exports.VehiclesService = VehiclesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], VehiclesService);
//# sourceMappingURL=vehicles.service.js.map