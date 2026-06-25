import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleFilterDto } from './dto/vehicle-filter.dto';
import { CreateVehicleDocumentDto, UpdateVehicleDocumentDto, VehicleDocumentFilterDto } from './dto/vehicle-document.dto';
import { VehicleStatus, VehicleDocumentStatus } from '@prisma/client';

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

  // Vehicle Document Methods
  async createVehicleDocument(vehicleId: string, createVehicleDocumentDto: CreateVehicleDocumentDto, userId: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    // Check if document type already exists and is not rejected
    const existingDocument = await this.prisma.vehicleDocument.findFirst({
      where: {
        vehicleId,
        documentType: createVehicleDocumentDto.documentType,
        status: { in: [VehicleDocumentStatus.PENDING, VehicleDocumentStatus.UNDER_REVIEW, VehicleDocumentStatus.VERIFIED] },
      },
    });

    if (existingDocument) {
      throw new ConflictException(`Document of type ${createVehicleDocumentDto.documentType} already exists and is ${existingDocument.status}`);
    }

    const vehicleDocument = await this.prisma.vehicleDocument.create({
      data: {
        vehicleId,
        documentType: createVehicleDocumentDto.documentType,
        fileUrl: createVehicleDocumentDto.fileUrl,
        fileName: createVehicleDocumentDto.fileName,
        fileSize: createVehicleDocumentDto.fileSize,
        mimeType: createVehicleDocumentDto.mimeType,
        status: VehicleDocumentStatus.PENDING,
        expiresAt: createVehicleDocumentDto.expiresAt,
      },
    });

    await this.auditService.log({
      userId,
      action: 'CREATE',
      entityType: 'VEHICLE_DOCUMENT',
      entityId: vehicleDocument.id,
      newValue: { documentType: vehicleDocument.documentType, vehicleId },
    });

    return vehicleDocument;
  }

  async findVehicleDocuments(vehicleId: string, filterDto?: VehicleDocumentFilterDto) {
    const where: any = { vehicleId };

    if (filterDto?.status) where.status = filterDto.status;
    if (filterDto?.documentType) where.documentType = filterDto.documentType;

    const documents = await this.prisma.vehicleDocument.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return documents;
  }

  async findPendingVehicleDocuments(filterDto?: VehicleDocumentFilterDto) {
    const where: any = { status: VehicleDocumentStatus.PENDING };

    if (filterDto?.documentType) where.documentType = filterDto.documentType;
    if (filterDto?.vehicleId) where.vehicleId = filterDto.vehicleId;

    const documents = await this.prisma.vehicleDocument.findMany({
      where,
      include: {
        vehicle: {
          select: {
            id: true,
            plateNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return documents;
  }

  async updateVehicleDocument(documentId: string, updateVehicleDocumentDto: UpdateVehicleDocumentDto, userId: string) {
    const document = await this.prisma.vehicleDocument.findUnique({
      where: { id: documentId },
      include: { vehicle: true },
    });

    if (!document) {
      throw new NotFoundException('Vehicle document not found');
    }

    const updateData: any = {};
    if (updateVehicleDocumentDto.status !== undefined) {
      updateData.status = updateVehicleDocumentDto.status;
      updateData.reviewedAt = new Date();
      updateData.reviewedBy = userId;
    }
    if (updateVehicleDocumentDto.rejectionReason !== undefined) {
      updateData.rejectionReason = updateVehicleDocumentDto.rejectionReason;
    }
    if (updateVehicleDocumentDto.expiresAt !== undefined) {
      updateData.expiresAt = updateVehicleDocumentDto.expiresAt;
    }

    const updatedDocument = await this.prisma.vehicleDocument.update({
      where: { id: documentId },
      data: updateData,
    });

    await this.auditService.log({
      userId,
      action: 'UPDATE',
      entityType: 'VEHICLE_DOCUMENT',
      entityId: documentId,
      oldValue: { ...document },
      newValue: updateData,
    });

    return updatedDocument;
  }

  async deleteVehicleDocument(documentId: string, userId: string) {
    const document = await this.prisma.vehicleDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Vehicle document not found');
    }

    if (document.status === VehicleDocumentStatus.VERIFIED) {
      throw new BadRequestException('Cannot delete verified documents');
    }

    await this.prisma.vehicleDocument.delete({
      where: { id: documentId },
    });

    await this.auditService.log({
      userId,
      action: 'DELETE',
      entityType: 'VEHICLE_DOCUMENT',
      entityId: documentId,
      oldValue: { documentType: document.documentType, vehicleId: document.vehicleId },
    });

    return { message: 'Vehicle document deleted successfully' };
  }
}
