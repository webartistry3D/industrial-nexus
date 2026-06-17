import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { WeightWatchService } from '../weight-watch/weight-watch.service';
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
  ) {}

  async create(createTripDto: CreateTripDto, userId: string) {
    // Verify order exists and is ready for assignment
    const order = await this.prisma.order.findUnique({
      where: { id: createTripDto.orderId },
      include: { handlingTags: true, trip: true },
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
      order.handlingTags.map(t => t.tag),
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

    // Update order status
    await this.prisma.order.update({
      where: { id: createTripDto.orderId },
      data: { status: OrderStatus.ASSIGNED },
    });

    // Update driver availability
    await this.prisma.driver.update({
      where: { id: createTripDto.driverId },
      data: { availability: DriverAvailability.ON_TRIP },
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

  async findOne(id: string) {
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

    return updatedTrip;
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
      },
    });

    // Revalidate weight
    await this.weightWatchService.validateTripWeight(
      trip.order.totalWeight,
      newVehicle.id,
      trip.order.handlingTags.map(t => t.tag),
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
