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
exports.TripsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const weight_watch_service_1 = require("../weight-watch/weight-watch.service");
const client_1 = require("@prisma/client");
let TripsService = class TripsService {
    constructor(prisma, auditService, weightWatchService) {
        this.prisma = prisma;
        this.auditService = auditService;
        this.weightWatchService = weightWatchService;
    }
    async create(createTripDto, userId) {
        const order = await this.prisma.order.findUnique({
            where: { id: createTripDto.orderId },
            include: { handlingTags: true, trip: true },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        if (order.trip) {
            throw new common_1.BadRequestException('Order already has an assigned trip');
        }
        if (order.status !== client_1.OrderStatus.DISPATCH_READY && order.status !== client_1.OrderStatus.ASSIGNED) {
            throw new common_1.BadRequestException(`Order must be in DISPATCH_READY status to create trip. Current status: ${order.status}`);
        }
        const driver = await this.prisma.driver.findUnique({
            where: { id: createTripDto.driverId },
        });
        if (!driver) {
            throw new common_1.NotFoundException('Driver not found');
        }
        if (driver.availability !== client_1.DriverAvailability.AVAILABLE) {
            throw new common_1.BadRequestException('Driver is not available');
        }
        const vehicle = await this.prisma.vehicle.findUnique({
            where: { id: createTripDto.vehicleId },
        });
        if (!vehicle) {
            throw new common_1.NotFoundException('Vehicle not found');
        }
        const weightValidation = await this.weightWatchService.validateTripWeight(order.totalWeight, vehicle.id, order.handlingTags.map(t => t.tag));
        if (!weightValidation.canAssign) {
            throw new common_1.BadRequestException(`Weight validation failed: ${weightValidation.reason}`);
        }
        const trip = await this.prisma.trip.create({
            data: {
                orderId: createTripDto.orderId,
                driverId: createTripDto.driverId,
                vehicleId: createTripDto.vehicleId,
                status: client_1.TripStatus.ASSIGNED,
            },
            include: {
                order: {
                    include: { handlingTags: true },
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
                vehicle: true,
            },
        });
        await this.prisma.order.update({
            where: { id: createTripDto.orderId },
            data: { status: client_1.OrderStatus.ASSIGNED },
        });
        await this.prisma.driver.update({
            where: { id: createTripDto.driverId },
            data: { availability: client_1.DriverAvailability.ON_TRIP },
        });
        await this.weightWatchService.createWeightRecord(trip.id, order.id, order.totalWeight, vehicle.capacityKg);
        await this.prisma.driverAssignment.create({
            data: {
                tripId: trip.id,
                driverId: createTripDto.driverId,
                vehicleId: createTripDto.vehicleId,
                assignedBy: userId,
            },
        });
        await this.auditService.log({
            userId,
            action: 'CREATE',
            entityType: 'TRIP',
            entityId: trip.id,
            newValue: { orderId: trip.orderId, driverId: trip.driverId, vehicleId: trip.vehicleId },
        });
        return trip;
    }
    async findAll(filterDto) {
        const { page = 1, limit = 10, status, driverId, orderId } = filterDto;
        const skip = (page - 1) * limit;
        const where = {};
        if (status)
            where.status = status;
        if (driverId)
            where.driverId = driverId;
        if (orderId)
            where.orderId = orderId;
        const [trips, total] = await Promise.all([
            this.prisma.trip.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    order: {
                        select: {
                            id: true,
                            orderNumber: true,
                            status: true,
                            totalWeight: true,
                            pickupLocation: true,
                            deliveryLocation: true,
                            priority: true,
                        },
                    },
                    driver: {
                        include: {
                            user: {
                                select: {
                                    firstName: true,
                                    lastName: true,
                                    phoneNumber: true,
                                },
                            },
                        },
                    },
                    vehicle: true,
                    weightRecords: {
                        orderBy: { checkedAt: 'desc' },
                        take: 1,
                    },
                    trackingPoints: {
                        orderBy: { timestamp: 'desc' },
                        take: 1,
                    },
                },
            }),
            this.prisma.trip.count({ where }),
        ]);
        return {
            data: trips,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(id) {
        const trip = await this.prisma.trip.findUnique({
            where: { id },
            include: {
                order: {
                    include: { handlingTags: true },
                },
                driver: {
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
                    },
                },
                vehicle: true,
                trackingPoints: {
                    orderBy: { timestamp: 'desc' },
                },
                weightRecords: {
                    orderBy: { checkedAt: 'desc' },
                },
                geofenceEvents: {
                    orderBy: { triggeredAt: 'desc' },
                    include: { geofence: true },
                },
                pod: true,
                assignments: {
                    orderBy: { assignedAt: 'desc' },
                },
            },
        });
        if (!trip) {
            throw new common_1.NotFoundException('Trip not found');
        }
        return trip;
    }
    async startTrip(id, userId) {
        const trip = await this.findOne(id);
        if (trip.status !== client_1.TripStatus.ASSIGNED && trip.status !== client_1.TripStatus.SOP_COMPLETED) {
            throw new common_1.BadRequestException(`Cannot start trip in ${trip.status} status`);
        }
        const updatedTrip = await this.prisma.trip.update({
            where: { id },
            data: {
                status: client_1.TripStatus.IN_TRANSIT,
                startedAt: new Date(),
            },
        });
        await this.prisma.order.update({
            where: { id: trip.orderId },
            data: { status: client_1.OrderStatus.IN_TRANSIT },
        });
        await this.auditService.log({
            userId,
            action: 'UPDATE',
            entityType: 'TRIP',
            entityId: id,
            oldValue: { status: trip.status },
            newValue: { status: client_1.TripStatus.IN_TRANSIT },
        });
        return updatedTrip;
    }
    async completeTrip(id, userId) {
        const trip = await this.findOne(id);
        if (trip.status !== client_1.TripStatus.IN_TRANSIT && trip.status !== client_1.TripStatus.ARRIVED) {
            throw new common_1.BadRequestException(`Cannot complete trip in ${trip.status} status`);
        }
        const updatedTrip = await this.prisma.trip.update({
            where: { id },
            data: {
                status: client_1.TripStatus.DELIVERED,
                completedAt: new Date(),
            },
        });
        await this.prisma.order.update({
            where: { id: trip.orderId },
            data: { status: client_1.OrderStatus.DELIVERED },
        });
        await this.prisma.driver.update({
            where: { id: trip.driverId },
            data: { availability: client_1.DriverAvailability.AVAILABLE },
        });
        await this.auditService.log({
            userId,
            action: 'UPDATE',
            entityType: 'TRIP',
            entityId: id,
            oldValue: { status: trip.status },
            newValue: { status: client_1.TripStatus.DELIVERED },
        });
        return updatedTrip;
    }
    async updateDriverAssignment(id, assignDriverDto, userId) {
        const trip = await this.findOne(id);
        const newDriver = await this.prisma.driver.findUnique({
            where: { id: assignDriverDto.driverId },
        });
        if (!newDriver) {
            throw new common_1.NotFoundException('New driver not found');
        }
        if (newDriver.availability !== client_1.DriverAvailability.AVAILABLE) {
            throw new common_1.BadRequestException('New driver is not available');
        }
        const newVehicle = await this.prisma.vehicle.findUnique({
            where: { id: assignDriverDto.vehicleId },
        });
        if (!newVehicle) {
            throw new common_1.NotFoundException('New vehicle not found');
        }
        await this.prisma.driver.update({
            where: { id: trip.driverId },
            data: { availability: client_1.DriverAvailability.AVAILABLE },
        });
        const updatedTrip = await this.prisma.trip.update({
            where: { id },
            data: {
                driverId: assignDriverDto.driverId,
                vehicleId: assignDriverDto.vehicleId,
            },
        });
        await this.prisma.driver.update({
            where: { id: assignDriverDto.driverId },
            data: { availability: client_1.DriverAvailability.ON_TRIP },
        });
        await this.prisma.driverAssignment.create({
            data: {
                tripId: id,
                driverId: assignDriverDto.driverId,
                vehicleId: assignDriverDto.vehicleId,
                assignedBy: userId,
                reason: assignDriverDto.reason,
            },
        });
        await this.weightWatchService.validateTripWeight(trip.order.totalWeight, newVehicle.id, trip.order.handlingTags.map(t => t.tag));
        await this.auditService.log({
            userId,
            action: 'UPDATE',
            entityType: 'TRIP',
            entityId: id,
            oldValue: { driverId: trip.driverId, vehicleId: trip.vehicleId },
            newValue: { driverId: assignDriverDto.driverId, vehicleId: assignDriverDto.vehicleId },
        });
        return updatedTrip;
    }
};
exports.TripsService = TripsService;
exports.TripsService = TripsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        weight_watch_service_1.WeightWatchService])
], TripsService);
//# sourceMappingURL=trips.service.js.map