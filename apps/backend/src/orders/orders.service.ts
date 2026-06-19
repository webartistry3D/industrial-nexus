import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderFilterDto } from './dto/order-filter.dto';
import { OrderStatus, KittingStatus, UserRole, Priority } from '@prisma/client';

const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.DRAFT]: [OrderStatus.SUBMITTED, OrderStatus.CANCELLED, OrderStatus.REJECTED],
  [OrderStatus.SUBMITTED]: [OrderStatus.APPROVED, OrderStatus.CANCELLED, OrderStatus.REJECTED],
  [OrderStatus.APPROVED]: [OrderStatus.KITTING, OrderStatus.CANCELLED],
  [OrderStatus.KITTING]: [OrderStatus.DISPATCH_READY, OrderStatus.CANCELLED],
  [OrderStatus.DISPATCH_READY]: [OrderStatus.ASSIGNED, OrderStatus.CANCELLED],
  [OrderStatus.ASSIGNED]: [OrderStatus.IN_TRANSIT, OrderStatus.CANCELLED],
  [OrderStatus.IN_TRANSIT]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REJECTED]: [],
};

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(createOrderDto: CreateOrderDto, userId: string, userRole: UserRole) {
    const orderNumber = await this.generateOrderNumber();

    // Validate client assignment
    let clientId = userId;
    if (createOrderDto.clientId && userRole !== UserRole.CLIENT) {
      clientId = createOrderDto.clientId;
    }

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        clientId,
        status: OrderStatus.DRAFT,
        totalWeight: createOrderDto.totalWeight,
        priority: createOrderDto.priority || Priority.NORMAL,
        pickupLocation: createOrderDto.pickupLocation,
        deliveryLocation: createOrderDto.deliveryLocation,
        cargoDescription: createOrderDto.cargoDescription,
        deliveryInstructions: createOrderDto.deliveryInstructions,
        kittingStatus: KittingStatus.PENDING,
      },
    });

    // Create handling tags if provided
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

  async findAll(filterDto: OrderFilterDto, userId: string, userRole: UserRole) {
    const { page = 1, limit = 10, status, priority, search, clientId, kittingStatus } = filterDto;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    // Role-based filtering
    if (userRole === UserRole.CLIENT) {
      where.clientId = userId;
    } else if (clientId) {
      where.clientId = clientId;
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (kittingStatus) where.kittingStatus = kittingStatus;
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
                  vehicle: {
                    select: {
                      id: true,
                      plateNumber: true,
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

  async findOne(id: string, userId?: string, userRole?: UserRole) {
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
                vehicle: true,
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
      throw new NotFoundException('Order not found');
    }

    // Check permissions for client role
    if (userRole === UserRole.CLIENT && order.clientId !== userId) {
      throw new ForbiddenException('You do not have access to this order');
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto, userId: string, userRole: UserRole) {
    const existingOrder = await this.findOne(id, userId, userRole);

    // Only allow updates in certain statuses
    const editableStatuses: OrderStatus[] = [OrderStatus.DRAFT, OrderStatus.SUBMITTED];
    if (!editableStatuses.includes(existingOrder.status)) {
      throw new BadRequestException(`Cannot update order in ${existingOrder.status} status`);
    }

    const updateData: any = {};
    
    if (updateOrderDto.totalWeight !== undefined) updateData.totalWeight = updateOrderDto.totalWeight;
    if (updateOrderDto.priority !== undefined) updateData.priority = updateOrderDto.priority;
    if (updateOrderDto.pickupLocation !== undefined) updateData.pickupLocation = updateOrderDto.pickupLocation;
    if (updateOrderDto.deliveryLocation !== undefined) updateData.deliveryLocation = updateOrderDto.deliveryLocation;
    if (updateOrderDto.cargoDescription !== undefined) updateData.cargoDescription = updateOrderDto.cargoDescription;
    if (updateOrderDto.deliveryInstructions !== undefined) updateData.deliveryInstructions = updateOrderDto.deliveryInstructions;

    const order = await this.prisma.order.update({
      where: { id },
      data: updateData,
    });

    // Update handling tags if provided
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

  async changeStatus(id: string, newStatus: OrderStatus, userId: string, userRole: UserRole, notes?: string, driverId?: string) {
    const order = await this.findOne(id, userId, userRole);
    const currentStatus = order.status;

    // Validate status transition
    const validTransitions = VALID_STATUS_TRANSITIONS[currentStatus];
    if (!validTransitions.includes(newStatus)) {
      throw new BadRequestException(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }

    // Role-based permission checks
    const approverRoles: UserRole[] = [UserRole.SUPER_ADMIN, UserRole.OPERATIONS];
    if (newStatus === OrderStatus.APPROVED && !approverRoles.includes(userRole)) {
      throw new ForbiddenException('Only admin or operations can approve orders');
    }

    const updateData: any = { status: newStatus };

    // Set timestamps based on status
    if (newStatus === OrderStatus.SUBMITTED) updateData.submittedAt = new Date();
    if (newStatus === OrderStatus.APPROVED) updateData.approvedAt = new Date();
    if (newStatus === OrderStatus.CANCELLED) updateData.cancelledAt = new Date();

    // Handle driver assignment for ASSIGNED status
    if (newStatus === OrderStatus.ASSIGNED && driverId) {
      // Check if driver exists and is active - look up by userId since frontend passes user IDs
      const driver = await this.prisma.driver.findFirst({
        where: { userId: driverId },
      });

      if (!driver) {
        throw new NotFoundException('Driver not found');
      }

      if (driver.status !== 'ACTIVE') {
        throw new BadRequestException('Driver is not active');
      }

      // Create trip when assigning driver
      await this.prisma.trip.create({
        data: {
          orderId: id,
          driverId: driver.id,
          vehicleId: driver.vehicleId || null,
          status: 'ASSIGNED',
        },
      });
    }

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
      newValue: { status: newStatus, notes, driverId },
    });

    return updatedOrder;
  }

  async cancel(id: string, userId: string, userRole: UserRole, reason?: string) {
    return this.changeStatus(id, OrderStatus.CANCELLED, userId, userRole, reason);
  }

  async assignDriver(id: string, driverId: string, userId: string, userRole: UserRole) {
    const order = await this.findOne(id, userId, userRole);

    if (order.status !== OrderStatus.DISPATCH_READY) {
      throw new BadRequestException(`Cannot assign driver to order in ${order.status} status`);
    }

    // Check if driver exists and is active
    const driver = await this.prisma.driver.findFirst({
      where: { userId: driverId },
      include: { user: true },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    if (driver.status !== 'ACTIVE') {
      throw new BadRequestException('Driver is not active');
    }

    // Update order status and create trip
    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: OrderStatus.ASSIGNED,
      },
    });

    // Create trip
    await this.prisma.trip.create({
      data: {
        orderId: id,
        driverId: driver.id,
        vehicleId: driver.vehicleId || null,
        status: 'ASSIGNED',
      },
    });

    await this.auditService.log({
      userId,
      action: 'STATUS_CHANGE',
      entityType: 'ORDER',
      entityId: id,
      oldValue: { status: order.status },
      newValue: { status: OrderStatus.ASSIGNED, driverId },
    });

    return this.findOne(id);
  }

  private async generateOrderNumber(): Promise<string> {
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
}
