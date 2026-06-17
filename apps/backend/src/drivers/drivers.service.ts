import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { DriverFilterDto } from './dto/driver-filter.dto';
import { DriverAvailability, DriverStatus, KycStatus } from '@prisma/client';

@Injectable()
export class DriversService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(createDriverDto: CreateDriverDto, userId: string) {
    // Check if user exists and doesn't already have a driver profile
    const user = await this.prisma.user.findUnique({
      where: { id: createDriverDto.userId },
      include: { driver: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.driver) {
      throw new ConflictException('User already has a driver profile');
    }

    // Verify vehicle exists if provided
    if (createDriverDto.vehicleId) {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: createDriverDto.vehicleId },
      });
      if (!vehicle) {
        throw new NotFoundException('Vehicle not found');
      }
    }

    const driver = await this.prisma.driver.create({
      data: {
        userId: createDriverDto.userId,
        licenseNumber: createDriverDto.licenseNumber,
        kycStatus: KycStatus.PENDING,
        status: DriverStatus.ACTIVE,
        availability: DriverAvailability.AVAILABLE,
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

  async findAll(filterDto: DriverFilterDto) {
    const { page = 1, limit = 10, status, availability, kycStatus, search } = filterDto;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (status) where.status = status;
    if (availability) where.availability = availability;
    if (kycStatus) where.kycStatus = kycStatus;
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

  async findOne(id: string) {
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
      throw new NotFoundException('Driver not found');
    }

    return driver;
  }

  async update(id: string, updateDriverDto: UpdateDriverDto, userId: string) {
    const existingDriver = await this.findOne(id);

    // Check if vehicle exists if provided
    if (updateDriverDto.vehicleId && updateDriverDto.vehicleId !== existingDriver.vehicleId) {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: updateDriverDto.vehicleId },
      });
      if (!vehicle) {
        throw new NotFoundException('Vehicle not found');
      }
    }

    const updateData: any = {};
    if (updateDriverDto.licenseNumber !== undefined) updateData.licenseNumber = updateDriverDto.licenseNumber;
    if (updateDriverDto.kycStatus !== undefined) updateData.kycStatus = updateDriverDto.kycStatus;
    if (updateDriverDto.status !== undefined) updateData.status = updateDriverDto.status;
    if (updateDriverDto.availability !== undefined) updateData.availability = updateDriverDto.availability;
    if (updateDriverDto.vehicleId !== undefined) updateData.vehicleId = updateDriverDto.vehicleId;

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

  async updateAvailability(id: string, availability: DriverAvailability, userId: string) {
    return this.update(id, { availability }, userId);
  }

  async verifyKyc(id: string, userId: string) {
    return this.update(id, { kycStatus: KycStatus.VERIFIED }, userId);
  }

  async deactivate(id: string, userId: string) {
    const driver = await this.findOne(id);
    
    // Prevent deactivation if driver is on a trip
    if (driver.availability === DriverAvailability.ON_TRIP) {
      throw new BadRequestException('Cannot deactivate driver who is currently on a trip');
    }
    
    return this.update(id, { status: DriverStatus.INACTIVE, availability: DriverAvailability.OFF_DUTY }, userId);
  }
}
