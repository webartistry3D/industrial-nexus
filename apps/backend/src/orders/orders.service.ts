import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
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
    private notificationsService: NotificationsService,
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
      const availableTags = await this.prisma.availableHandlingTag.findMany({
        where: { name: { in: createOrderDto.handlingTags.map(t => t.toUpperCase()) } },
      });
      await this.prisma.orderHandlingTag.createMany({
        data: availableTags.map(tag => ({ orderId: order.id, tagId: tag.id })),
      });
    }

    await this.auditService.log({
      userId,
      action: 'CREATE',
      entityType: 'ORDER',
      entityId: order.id,
      newValue: { orderNumber, status: order.status, clientId },
    });

    // Notify admins/ops of new draft order (fire-and-forget)
    this.prisma.user.findMany({
      where: { role: { in: ['SUPER_ADMIN', 'OPERATIONS'] as any } },
      select: { id: true },
    }).then(adminOps => {
      this.notificationsService.notifyOrderCreated(
        adminOps.map(u => u.id),
        orderNumber,
        order.id,
      ).catch(e => console.error('[Notifications] notifyOrderCreated error:', e));
    }).catch(() => {});

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
          handlingTags: { include: { tag: true } },
          packageTracker: {
            select: {
              id: true,
              deviceId: true,
              name: true,
              status: true,
            },
          },
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
        handlingTags: { include: { tag: true } },
        packageTracker: {
          select: {
            id: true,
            deviceId: true,
            name: true,
            status: true,
          },
        },
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
      await this.prisma.orderHandlingTag.deleteMany({ where: { orderId: id } });
      if (updateOrderDto.handlingTags.length > 0) {
        const availableTags = await this.prisma.availableHandlingTag.findMany({
          where: { name: { in: updateOrderDto.handlingTags.map(t => t.toUpperCase()) } },
        });
        await this.prisma.orderHandlingTag.createMany({
          data: availableTags.map(tag => ({ orderId: id, tagId: tag.id })),
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

  async changeStatus(id: string, newStatus: OrderStatus, userId: string, userRole: UserRole, notes?: string, driverId?: string, vehicleId?: string) {
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

    // Update kittingStatus when order transitions past kitting phase
    if (
      newStatus === OrderStatus.DISPATCH_READY ||
      newStatus === OrderStatus.ASSIGNED ||
      newStatus === OrderStatus.IN_TRANSIT ||
      newStatus === OrderStatus.DELIVERED
    ) {
      if (order.kittingStatus === KittingStatus.PENDING) {
        updateData.kittingStatus = KittingStatus.DISPATCH_READY;
      }
    }

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

      const resolvedVehicleId = vehicleId || driver.vehicleId || null;

      // Create trip when assigning driver
      await this.prisma.trip.create({
        data: {
          orderId: id,
          driverId: driver.id,
          vehicleId: resolvedVehicleId,
          status: 'ASSIGNED',
        },
      });

      // Update driver profile with the assigned vehicle (supports reassignment)
      if (resolvedVehicleId && resolvedVehicleId !== driver.vehicleId) {
        await this.prisma.driver.update({
          where: { id: driver.id },
          data: { vehicleId: resolvedVehicleId },
        });
      }
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

    // Fire notifications based on new status
    console.log(`[Notifications] Firing status notifications: status=${newStatus}, driverId=${driverId}, clientId=${order.clientId}`);
    this.fireStatusNotifications(newStatus, order.orderNumber, id, order.clientId, driverId)
      .catch(e => console.error('[Notifications] fireStatusNotifications error:', e));

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

    const resolvedVehicleId = driver.vehicleId || null;

    // Create trip
    await this.prisma.trip.create({
      data: {
        orderId: id,
        driverId: driver.id,
        vehicleId: resolvedVehicleId,
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

    // Notify driver, client, admin and ops of driver assignment
    this.prisma.user.findMany({
      where: { role: { in: ['SUPER_ADMIN', 'OPERATIONS'] as any } },
      select: { id: true },
    }).then(adminOps => {
      this.notificationsService.notifyDriverAssigned(
        driver.user.id,
        order.clientId,
        adminOps.map(u => u.id),
        order.orderNumber,
        id,
      ).catch(e => console.error('[Notifications] notifyDriverAssigned error:', e));
    }).catch(() => {});

    return this.findOne(id);
  }

  private async fireStatusNotifications(
    newStatus: OrderStatus,
    orderNumber: string,
    orderId: string,
    clientId: string,
    driverId?: string,
  ): Promise<void> {
    const getAdminOps = () =>
      this.prisma.user.findMany({
        where: { role: { in: ['SUPER_ADMIN', 'OPERATIONS'] as any } },
        select: { id: true },
      });

    if (newStatus === OrderStatus.SUBMITTED) {
      const adminOps = await getAdminOps();
      await this.notificationsService.notifyOrderSubmitted(
        adminOps.map(u => u.id),
        orderNumber,
        orderId,
        clientId,
      );
    } else if (newStatus === OrderStatus.REJECTED) {
      const adminOps = await getAdminOps();
      await this.notificationsService.notifyOrderRejected(
        clientId,
        adminOps.map(u => u.id),
        orderNumber,
        orderId,
      );
    } else if (newStatus === OrderStatus.APPROVED) {
      const adminOps = await getAdminOps();
      await this.notificationsService.notifyOrderApproved(
        clientId,
        adminOps.map(u => u.id),
        orderNumber,
        orderId,
      );
    } else if (newStatus === OrderStatus.KITTING) {
      const adminOps = await getAdminOps();
      await Promise.all([
        this.notificationsService.notifyOrderStatusChanged(
          clientId,
          orderNumber,
          orderId,
          newStatus,
        ),
        ...adminOps.map(u =>
          this.notificationsService.notifyOrderStatusChanged(
            u.id,
            orderNumber,
            orderId,
            newStatus,
          ),
        ),
      ]);
    } else if (newStatus === OrderStatus.ASSIGNED && driverId) {
      console.log(`[Notifications] ASSIGNED case - driverId received: ${driverId}`);
      const adminOps = await getAdminOps();
      // driverId is the user ID (from frontend getUsers call)
      const driverUserId = driverId;
      console.log(`[Notifications] Sending notifyDriverAssigned to driverUserId=${driverUserId}, clientId=${clientId}, adminOps=${adminOps.map(u => u.id)}`);
      await this.notificationsService.notifyDriverAssigned(
        driverUserId,
        clientId,
        adminOps.map(u => u.id),
        orderNumber,
        orderId,
      );
      console.log(`[Notifications] notifyDriverAssigned completed`);
    } else if (newStatus === OrderStatus.DISPATCH_READY) {
      const adminOps = await getAdminOps();
      await this.notificationsService.notifyOrderDispatchReady(
        adminOps.map(u => u.id),
        orderNumber,
        orderId,
        clientId,
      );
    } else if (newStatus === OrderStatus.DELIVERED) {
      const adminOps = await getAdminOps();
      await Promise.all([
        this.notificationsService.notifyOrderStatusChanged(
          clientId,
          orderNumber,
          orderId,
          newStatus,
        ),
        ...adminOps.map(u =>
          this.notificationsService.notifyOrderStatusChanged(
            u.id,
            orderNumber,
            orderId,
            newStatus,
          ),
        ),
      ]);
    } else if (newStatus === OrderStatus.CANCELLED) {
      const adminOps = await getAdminOps();
      await Promise.all([
        this.notificationsService.notifyOrderStatusChanged(
          clientId,
          orderNumber,
          orderId,
          newStatus,
        ),
        ...adminOps.map(u =>
          this.notificationsService.notifyOrderStatusChanged(
            u.id,
            orderNumber,
            orderId,
            newStatus,
          ),
        ),
      ]);
    }
  }

  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const prefix = `IN-ORD-${year}`;
    
    const count = await this.prisma.order.count({
      where: {
        orderNumber: { startsWith: prefix },
      },
    });

    return `${prefix}-${String(count + 1).padStart(6, '0')}`;
  }
}
