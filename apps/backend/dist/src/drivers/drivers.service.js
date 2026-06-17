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
exports.DriversService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const client_1 = require("@prisma/client");
let DriversService = class DriversService {
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async create(createDriverDto, userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: createDriverDto.userId },
            include: { driver: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (user.driver) {
            throw new common_1.ConflictException('User already has a driver profile');
        }
        if (createDriverDto.vehicleId) {
            const vehicle = await this.prisma.vehicle.findUnique({
                where: { id: createDriverDto.vehicleId },
            });
            if (!vehicle) {
                throw new common_1.NotFoundException('Vehicle not found');
            }
        }
        const driver = await this.prisma.driver.create({
            data: {
                userId: createDriverDto.userId,
                licenseNumber: createDriverDto.licenseNumber,
                kycStatus: client_1.KycStatus.PENDING,
                status: client_1.DriverStatus.ACTIVE,
                availability: client_1.DriverAvailability.AVAILABLE,
                vehicleId: createDriverDto.vehicleId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        phoneNumber: true,
                    },
                },
                vehicle: true,
            },
        });
        await this.auditService.log({
            userId,
            action: 'CREATE',
            entityType: 'DRIVER',
            entityId: driver.id,
            newValue: { licenseNumber: driver.licenseNumber, userId: driver.userId },
        });
        return driver;
    }
    async findAll(filterDto) {
        const { page = 1, limit = 10, status, availability, kycStatus, search } = filterDto;
        const skip = (page - 1) * limit;
        const where = {};
        if (status)
            where.status = status;
        if (availability)
            where.availability = availability;
        if (kycStatus)
            where.kycStatus = kycStatus;
        if (search) {
            where.user = {
                OR: [
                    { email: { contains: search, mode: 'insensitive' } },
                    { firstName: { contains: search, mode: 'insensitive' } },
                    { lastName: { contains: search, mode: 'insensitive' } },
                ],
            };
        }
        const [drivers, total] = await Promise.all([
            this.prisma.driver.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                            phoneNumber: true,
                        },
                    },
                    vehicle: true,
                },
            }),
            this.prisma.driver.count({ where }),
        ]);
        return {
            data: drivers,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(id) {
        const driver = await this.prisma.driver.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        phoneNumber: true,
                    },
                },
                vehicle: true,
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
                    },
                },
            },
        });
        if (!driver) {
            throw new common_1.NotFoundException('Driver not found');
        }
        return driver;
    }
    async update(id, updateDriverDto, userId) {
        const existingDriver = await this.findOne(id);
        if (updateDriverDto.vehicleId && updateDriverDto.vehicleId !== existingDriver.vehicleId) {
            const vehicle = await this.prisma.vehicle.findUnique({
                where: { id: updateDriverDto.vehicleId },
            });
            if (!vehicle) {
                throw new common_1.NotFoundException('Vehicle not found');
            }
        }
        const updateData = {};
        if (updateDriverDto.licenseNumber !== undefined)
            updateData.licenseNumber = updateDriverDto.licenseNumber;
        if (updateDriverDto.kycStatus !== undefined)
            updateData.kycStatus = updateDriverDto.kycStatus;
        if (updateDriverDto.status !== undefined)
            updateData.status = updateDriverDto.status;
        if (updateDriverDto.availability !== undefined)
            updateData.availability = updateDriverDto.availability;
        if (updateDriverDto.vehicleId !== undefined)
            updateData.vehicleId = updateDriverDto.vehicleId;
        const driver = await this.prisma.driver.update({
            where: { id },
            data: updateData,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        phoneNumber: true,
                    },
                },
                vehicle: true,
            },
        });
        await this.auditService.log({
            userId,
            action: 'UPDATE',
            entityType: 'DRIVER',
            entityId: id,
            oldValue: { ...existingDriver },
            newValue: updateData,
        });
        return driver;
    }
    async updateAvailability(id, availability, userId) {
        return this.update(id, { availability }, userId);
    }
    async verifyKyc(id, userId) {
        return this.update(id, { kycStatus: client_1.KycStatus.VERIFIED }, userId);
    }
    async deactivate(id, userId) {
        const driver = await this.findOne(id);
        if (driver.availability === client_1.DriverAvailability.ON_TRIP) {
            throw new common_1.BadRequestException('Cannot deactivate driver who is currently on a trip');
        }
        return this.update(id, { status: client_1.DriverStatus.INACTIVE, availability: client_1.DriverAvailability.OFF_DUTY }, userId);
    }
};
exports.DriversService = DriversService;
exports.DriversService = DriversService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], DriversService);
//# sourceMappingURL=drivers.service.js.map