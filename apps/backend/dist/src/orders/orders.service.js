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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const client_1 = require("@prisma/client");
const VALID_STATUS_TRANSITIONS = {
    [client_1.OrderStatus.DRAFT]: [client_1.OrderStatus.SUBMITTED, client_1.OrderStatus.CANCELLED],
    [client_1.OrderStatus.SUBMITTED]: [client_1.OrderStatus.APPROVED, client_1.OrderStatus.CANCELLED],
    [client_1.OrderStatus.APPROVED]: [client_1.OrderStatus.KITTING, client_1.OrderStatus.CANCELLED],
    [client_1.OrderStatus.KITTING]: [client_1.OrderStatus.DISPATCH_READY, client_1.OrderStatus.CANCELLED],
    [client_1.OrderStatus.DISPATCH_READY]: [client_1.OrderStatus.ASSIGNED, client_1.OrderStatus.CANCELLED],
    [client_1.OrderStatus.ASSIGNED]: [client_1.OrderStatus.IN_TRANSIT, client_1.OrderStatus.CANCELLED],
    [client_1.OrderStatus.IN_TRANSIT]: [client_1.OrderStatus.DELIVERED],
    [client_1.OrderStatus.DELIVERED]: [],
    [client_1.OrderStatus.CANCELLED]: [],
};
let OrdersService = class OrdersService {
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async create(createOrderDto, userId, userRole) {
        const orderNumber = await this.generateOrderNumber();
        let clientId = userId;
        if (createOrderDto.clientId && userRole !== client_1.UserRole.CLIENT) {
            clientId = createOrderDto.clientId;
        }
        const order = await this.prisma.order.create({
            data: {
                orderNumber,
                clientId,
                status: client_1.OrderStatus.DRAFT,
                totalWeight: createOrderDto.totalWeight,
                priority: createOrderDto.priority || client_1.Priority.NORMAL,
                pickupLocation: createOrderDto.pickupLocation,
                deliveryLocation: createOrderDto.deliveryLocation,
                cargoDescription: createOrderDto.cargoDescription,
                deliveryInstructions: createOrderDto.deliveryInstructions,
                kittingStatus: client_1.KittingStatus.PENDING,
            },
        });
        if (createOrderDto.handlingTags && createOrderDto.handlingTags.length > 0) {
            await this.prisma.handlingTag.createMany({
                data: createOrderDto.handlingTags.map(tag => ({
                    orderId: order.id,
                    tag,
                })),
            });
        }
        await this.auditService.log({
            userId,
            action: 'CREATE',
            entityType: 'ORDER',
            entityId: order.id,
            newValue: { orderNumber, status: order.status, clientId },
        });
        return this.findOne(order.id);
    }
    async findAll(filterDto, userId, userRole) {
        const { page = 1, limit = 10, status, priority, search, clientId } = filterDto;
        const skip = (page - 1) * limit;
        const where = {};
        if (userRole === client_1.UserRole.CLIENT) {
            where.clientId = userId;
        }
        else if (clientId) {
            where.clientId = clientId;
        }
        if (status)
            where.status = status;
        if (priority)
            where.priority = priority;
        if (search) {
            where.OR = [
                { orderNumber: { contains: search, mode: 'insensitive' } },
                { cargoDescription: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    client: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                    handlingTags: true,
                    trip: {
                        select: {
                            id: true,
                            status: true,
                            driver: {
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
                            vehicle: {
                                select: {
                                    id: true,
                                    plateNumber: true,
                                },
                            },
                        },
                    },
                    weightRecord: true,
                },
            }),
            this.prisma.order.count({ where }),
        ]);
        return {
            data: orders,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(id, userId, userRole) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: {
                client: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        phoneNumber: true,
                    },
                },
                handlingTags: true,
                kittingLogs: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        operator: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
                trip: {
                    include: {
                        driver: {
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
                        vehicle: true,
                        trackingPoints: {
                            orderBy: { timestamp: 'desc' },
                            take: 1,
                        },
                        pod: true,
                    },
                },
                weightRecord: true,
            },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        if (userRole === client_1.UserRole.CLIENT && order.clientId !== userId) {
            throw new common_1.ForbiddenException('You do not have access to this order');
        }
        return order;
    }
    async update(id, updateOrderDto, userId, userRole) {
        const existingOrder = await this.findOne(id, userId, userRole);
        const editableStatuses = [client_1.OrderStatus.DRAFT, client_1.OrderStatus.SUBMITTED];
        if (!editableStatuses.includes(existingOrder.status)) {
            throw new common_1.BadRequestException(`Cannot update order in ${existingOrder.status} status`);
        }
        const updateData = {};
        if (updateOrderDto.totalWeight !== undefined)
            updateData.totalWeight = updateOrderDto.totalWeight;
        if (updateOrderDto.priority !== undefined)
            updateData.priority = updateOrderDto.priority;
        if (updateOrderDto.pickupLocation !== undefined)
            updateData.pickupLocation = updateOrderDto.pickupLocation;
        if (updateOrderDto.deliveryLocation !== undefined)
            updateData.deliveryLocation = updateOrderDto.deliveryLocation;
        if (updateOrderDto.cargoDescription !== undefined)
            updateData.cargoDescription = updateOrderDto.cargoDescription;
        if (updateOrderDto.deliveryInstructions !== undefined)
            updateData.deliveryInstructions = updateOrderDto.deliveryInstructions;
        const order = await this.prisma.order.update({
            where: { id },
            data: updateData,
        });
        if (updateOrderDto.handlingTags !== undefined) {
            await this.prisma.handlingTag.deleteMany({ where: { orderId: id } });
            if (updateOrderDto.handlingTags.length > 0) {
                await this.prisma.handlingTag.createMany({
                    data: updateOrderDto.handlingTags.map(tag => ({
                        orderId: id,
                        tag,
                    })),
                });
            }
        }
        await this.auditService.log({
            userId,
            action: 'UPDATE',
            entityType: 'ORDER',
            entityId: id,
            oldValue: { ...existingOrder },
            newValue: updateData,
        });
        return this.findOne(id);
    }
    async changeStatus(id, newStatus, userId, userRole, notes) {
        const order = await this.findOne(id, userId, userRole);
        const currentStatus = order.status;
        const validTransitions = VALID_STATUS_TRANSITIONS[currentStatus];
        if (!validTransitions.includes(newStatus)) {
            throw new common_1.BadRequestException(`Invalid status transition from ${currentStatus} to ${newStatus}`);
        }
        const approverRoles = [client_1.UserRole.SUPER_ADMIN, client_1.UserRole.OPERATIONS];
        if (newStatus === client_1.OrderStatus.APPROVED && !approverRoles.includes(userRole)) {
            throw new common_1.ForbiddenException('Only admin or operations can approve orders');
        }
        const updateData = { status: newStatus };
        if (newStatus === client_1.OrderStatus.SUBMITTED)
            updateData.submittedAt = new Date();
        if (newStatus === client_1.OrderStatus.APPROVED)
            updateData.approvedAt = new Date();
        if (newStatus === client_1.OrderStatus.CANCELLED)
            updateData.cancelledAt = new Date();
        const updatedOrder = await this.prisma.order.update({
            where: { id },
            data: updateData,
        });
        await this.auditService.log({
            userId,
            action: 'STATUS_CHANGE',
            entityType: 'ORDER',
            entityId: id,
            oldValue: { status: currentStatus },
            newValue: { status: newStatus, notes },
        });
        return updatedOrder;
    }
    async cancel(id, userId, userRole, reason) {
        return this.changeStatus(id, client_1.OrderStatus.CANCELLED, userId, userRole, reason);
    }
    async generateOrderNumber() {
        const date = new Date();
        const year = date.getFullYear();
        const prefix = `ORD-${year}`;
        const count = await this.prisma.order.count({
            where: {
                orderNumber: { startsWith: prefix },
            },
        });
        return `${prefix}-${String(count + 1).padStart(6, '0')}`;
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map