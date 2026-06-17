import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleFilterDto } from './dto/vehicle-filter.dto';
import { VehicleStatus } from '@prisma/client';

@Injectable()
export class VehiclesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(createVehicleDto: CreateVehicleDto, userId: string) {
    // Check for duplicate plate number
    const existingVehicle = await this.prisma.vehicle.findUnique({
      where: { plateNumber: createVehicleDto.plateNumber },
    });

    if (existingVehicle) {
      throw new ConflictException('Vehicle with this plate number already exists');
    }

    const vehicle = await this.prisma.vehicle.create({
      data: {
        plateNumber: createVehicleDto.plateNumber,
        category: createVehicleDto.category,
        capacityKg: createVehicleDto.capacityKg,
        status: createVehicleDto.status || VehicleStatus.ACTIVE,
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

  async findAll(filterDto: VehicleFilterDto) {
    const { page = 1, limit = 10, status, category, search } = filterDto;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (status) where.status = status;
    if (category) where.category = category;
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

  async findOne(id: string) {
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
      throw new NotFoundException('Vehicle not found');
    }

    return vehicle;
  }

  async update(id: string, updateVehicleDto: UpdateVehicleDto, userId: string) {
    const existingVehicle = await this.findOne(id);

    const updateData: any = {};
    if (updateVehicleDto.plateNumber !== undefined) updateData.plateNumber = updateVehicleDto.plateNumber;
    if (updateVehicleDto.category !== undefined) updateData.category = updateVehicleDto.category;
    if (updateVehicleDto.capacityKg !== undefined) updateData.capacityKg = updateVehicleDto.capacityKg;
    if (updateVehicleDto.status !== undefined) updateData.status = updateVehicleDto.status;
    if (updateVehicleDto.isPartitioned !== undefined) updateData.isPartitioned = updateVehicleDto.isPartitioned;

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

  async deactivate(id: string, userId: string) {
    return this.update(id, { status: VehicleStatus.INACTIVE }, userId);
  }
}
