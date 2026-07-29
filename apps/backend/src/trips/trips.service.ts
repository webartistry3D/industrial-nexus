import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { WeightWatchService } from '../weight-watch/weight-watch.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { TripFilterDto } from './dto/trip-filter.dto';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { TripStatus, OrderStatus, DriverAvailability } from '@prisma/client';

@Injectable()
export class TripsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private weightWatchService: WeightWatchService,
    private notificationsService: NotificationsService,
  ) {}

  async create(createTripDto: CreateTripDto, userId: string) {
    // Verify order exists and is ready for assignment
    const order = await this.prisma.order.findUnique({
      where: { id: createTripDto.orderId },
      include: { handlingTags: { include: { tag: true } }, trip: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.trip) {
      throw new BadRequestException('Order already has an assigned trip');
    }

    if (order.status !== OrderStatus.DISPATCH_READY && order.status !== OrderStatus.ASSIGNED) {
      throw new BadRequestException(`Order must be in DISPATCH_READY status to create trip. Current status: ${order.status}`);
    }

    // Verify driver exists and is available
    const driver = await this.prisma.driver.findUnique({
      where: { id: createTripDto.driverId },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    if (driver.availability !== DriverAvailability.AVAILABLE) {
      throw new BadRequestException('Driver is not available');
    }

    // Verify vehicle exists
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: createTripDto.vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    // Validate weight constraints
    const weightValidation = await this.weightWatchService.validateTripWeight(
      order.totalWeight,
      vehicle.id,
      order.handlingTags.map(t => t.tag.name),
    );

    if (!weightValidation.canAssign) {
      throw new BadRequestException(`Weight validation failed: ${weightValidation.reason}`);
    }

    // Create trip
    const trip = await this.prisma.trip.create({
      data: {
        orderId: createTripDto.orderId,
        driverId: createTripDto.driverId,
        vehicleId: createTripDto.vehicleId,
        status: TripStatus.ASSIGNED,
      },
      include: {
        order: {
          include: { handlingTags: { include: { tag: true } } },
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

    // Update order status
    await this.prisma.order.update({
      where: { id: createTripDto.orderId },
      data: { status: OrderStatus.ASSIGNED },
    });

    // Update driver availability and vehicle assignment
    await this.prisma.driver.update({
      where: { id: createTripDto.driverId },
      data: {
        availability: DriverAvailability.ON_TRIP,
        vehicleId: createTripDto.vehicleId,
      },
    });

    // Create weight record
    await this.weightWatchService.createWeightRecord(
      trip.id,
      order.id,
      order.totalWeight,
      vehicle.capacityKg,
    );

    // Create assignment audit record
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

    // Notify driver and client
    try {
      await this.notificationsService.notifyTripAssigned(
        driver.userId,
        order.clientId,
        order.orderNumber,
        trip.id,
      );
    } catch (e) {
      console.error('[Notifications] Failed to send trip assigned notification:', e);
    }

    return trip;
  }

  async findAll(filterDto: TripFilterDto) {
    const { page = 1, limit = 10, status, driverId, orderId } = filterDto;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (driverId) where.driverId = driverId;
    if (orderId) where.orderId = orderId;

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

  async findDriverTrips(userId: string) {
    // First get the driver record for this user
    const driver = await this.prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      return { data: [] };
    }

    const trips = await this.prisma.trip.findMany({
      where: { driverId: driver.id },
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
            cargoDescription: true,
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
    });

    return { data: trips };
  }

  async findOne(id: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      include: {
        order: {
          include: { handlingTags: { include: { tag: true } } },
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
                role: true,
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
      throw new NotFoundException('Trip not found');
    }

    return trip;
  }

  async startTrip(id: string, userId: string) {
    const trip = await this.findOne(id);

    if (trip.status !== TripStatus.ASSIGNED && trip.status !== TripStatus.SOP_COMPLETED) {
      throw new BadRequestException(`Cannot start trip in ${trip.status} status`);
    }

    const updatedTrip = await this.prisma.trip.update({
      where: { id },
      data: {
        status: TripStatus.IN_TRANSIT,
        startedAt: new Date(),
      },
    });

    await this.prisma.order.update({
      where: { id: trip.orderId },
      data: { status: OrderStatus.IN_TRANSIT },
    });

    await this.auditService.log({
      userId,
      action: 'UPDATE',
      entityType: 'TRIP',
      entityId: id,
      oldValue: { status: trip.status },
      newValue: { status: TripStatus.IN_TRANSIT },
    });

    // Notify driver and client
    try {
      await this.notificationsService.notifyTripStarted(
        trip.driver.user.id,
        trip.order.clientId,
        trip.order.orderNumber,
        id,
      );
    } catch (e) {
      console.error('[Notifications] Failed to send trip started notification:', e);
    }

    return updatedTrip;
  }

  async completeTrip(id: string, userId: string) {
    const trip = await this.findOne(id);

    if (trip.status !== TripStatus.IN_TRANSIT && trip.status !== TripStatus.ARRIVED) {
      throw new BadRequestException(`Cannot complete trip in ${trip.status} status`);
    }

    const updatedTrip = await this.prisma.trip.update({
      where: { id },
      data: {
        status: TripStatus.DELIVERED,
        completedAt: new Date(),
      },
    });

    // Update order status
    await this.prisma.order.update({
      where: { id: trip.orderId },
      data: { status: OrderStatus.DELIVERED },
    });

    // Update driver availability
    await this.prisma.driver.update({
      where: { id: trip.driverId },
      data: { availability: DriverAvailability.AVAILABLE },
    });

    await this.auditService.log({
      userId,
      action: 'UPDATE',
      entityType: 'TRIP',
      entityId: id,
      oldValue: { status: trip.status },
      newValue: { status: TripStatus.DELIVERED },
    });

    // Notify driver and client
    try {
      await this.notificationsService.notifyTripCompleted(
        trip.driver.user.id,
        trip.order.clientId,
        trip.order.orderNumber,
        id,
      );
    } catch (e) {
      console.error('[Notifications] Failed to send trip completed notification:', e);
    }

    return updatedTrip;
  }

  async updateLocation(id: string, lat: number, lng: number, accuracy?: number) {
    // This is a simplified version - in production, use the tracking service
    // For now, we'll delegate to the tracking service if available
    // or create a simple tracking point here
    const trackingPoint = await this.prisma.trackingPoint.create({
      data: {
        tripId: id,
        lat,
        lng,
        accuracy,
        timestamp: new Date(),
      },
    });

    return trackingPoint;
  }

  async submitPOD(id: string, podData: { photoUrl?: string; signatureUrl?: string; receiverName?: string; receiverPhone?: string; notes?: string; lat?: number; lng?: number; damageReported?: boolean; damageDescription?: string }, userId: string) {
    const trip = await this.findOne(id);

    if (trip.pod) {
      throw new BadRequestException('POD already submitted for this trip');
    }

    const pod = await this.prisma.pOD.create({
      data: {
        tripId: id,
        imageUrl: podData.photoUrl,
        signatureUrl: podData.signatureUrl,
        receiverName: podData.receiverName,
        receiverPhone: podData.receiverPhone,
        notes: podData.notes,
        lat: podData.lat,
        lng: podData.lng,
        damageReported: podData.damageReported ?? false,
        damageDescription: podData.damageReported ? podData.damageDescription : undefined,
        capturedAt: new Date(),
      },
    });

    await this.auditService.log({
      userId,
      action: 'CREATE',
      entityType: 'POD',
      entityId: pod.id,
      newValue: { tripId: id, imageUrl: podData.photoUrl, lat: podData.lat, lng: podData.lng, damageReported: podData.damageReported ?? false },
    });

    return pod;
  }

  async submitChecklist(
    id: string,
    checklist: {
      vehicleInspected: boolean;
      cargoSecured: boolean;
      handlingTagsVerified: boolean;
      safetyComplianceConfirmed: boolean;
    },
    userId: string
  ) {
    const trip = await this.findOne(id);

    // Update trip status to SOP_COMPLETED if all items are checked
    if (
      checklist.vehicleInspected &&
      checklist.cargoSecured &&
      checklist.handlingTagsVerified &&
      checklist.safetyComplianceConfirmed
    ) {
      await this.prisma.trip.update({
        where: { id },
        data: { status: TripStatus.SOP_COMPLETED },
      });
    }

    await this.auditService.log({
      userId,
      action: 'UPDATE',
      entityType: 'TRIP',
      entityId: id,
      newValue: { checklist, status: TripStatus.SOP_COMPLETED },
    });

    return { success: true, status: TripStatus.SOP_COMPLETED };
  }

  async updateDriverAssignment(id: string, assignDriverDto: AssignDriverDto, userId: string) {
    const trip = await this.findOne(id);

    // Verify new driver exists and is available
    const newDriver = await this.prisma.driver.findUnique({
      where: { id: assignDriverDto.driverId },
    });

    if (!newDriver) {
      throw new NotFoundException('New driver not found');
    }

    if (newDriver.availability !== DriverAvailability.AVAILABLE) {
      throw new BadRequestException('New driver is not available');
    }

    // Verify new vehicle exists
    const newVehicle = await this.prisma.vehicle.findUnique({
      where: { id: assignDriverDto.vehicleId },
    });

    if (!newVehicle) {
      throw new NotFoundException('New vehicle not found');
    }

    // Update previous driver availability
    await this.prisma.driver.update({
      where: { id: trip.driverId },
      data: { availability: DriverAvailability.AVAILABLE },
    });

    // Close out the currently active assignment record for this trip, if any
    await this.prisma.driverAssignment.updateMany({
      where: { tripId: id, unassignedAt: null },
      data: { unassignedAt: new Date() },
    });

    // Update trip
    const updatedTrip = await this.prisma.trip.update({
      where: { id },
      data: {
        driverId: assignDriverDto.driverId,
        vehicleId: assignDriverDto.vehicleId,
      },
    });

    // Update new driver availability
    await this.prisma.driver.update({
      where: { id: assignDriverDto.driverId },
      data: { availability: DriverAvailability.ON_TRIP },
    });

    // Create assignment record
    await this.prisma.driverAssignment.create({
      data: {
        tripId: id,
        driverId: assignDriverDto.driverId,
        vehicleId: assignDriverDto.vehicleId,
        assignedBy: userId,
        reason: assignDriverDto.reason,
        isDispatchError: assignDriverDto.isDispatchError ?? false,
        errorType: assignDriverDto.isDispatchError ? assignDriverDto.errorType : undefined,
      },
    });

    // Revalidate weight
    await this.weightWatchService.validateTripWeight(
      trip.order.totalWeight,
      newVehicle.id,
      trip.order.handlingTags.map(t => t.tag.name),
    );

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
}
