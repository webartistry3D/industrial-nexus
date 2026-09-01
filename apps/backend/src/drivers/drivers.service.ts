import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { StorageService } from '../storage/storage.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { DriverFilterDto } from './dto/driver-filter.dto';
import { CreateKycDocumentDto, UpdateKycDocumentDto, KycDocumentFilterDto } from './dto/kyc-document.dto';
import { DriverAvailability, DriverStatus, KycStatus, KycDocumentStatus } from '@prisma/client';

@Injectable()
export class DriversService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private storageService: StorageService,
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
            profileImageUrl: true,
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
              profileImageUrl: true,
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
            profileImageUrl: true,
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
            profileImageUrl: true,
          },
        },
        vehicle: true,
      },
    });

    // Propagate vehicleId change to active trips so clients see the correct vehicle
    if (updateDriverDto.vehicleId !== undefined) {
      await this.prisma.trip.updateMany({
        where: {
          driverId: id,
          status: { notIn: ['DELIVERED', 'CANCELLED'] },
        },
        data: { vehicleId: updateDriverDto.vehicleId },
      });
    }

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

  // KYC Document Methods
  async createKycDocument(driverId: string, createKycDocumentDto: CreateKycDocumentDto, userId: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { id: driverId },
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    // Check if document type already exists and is not rejected
    const existingDocument = await this.prisma.kycDocument.findFirst({
      where: {
        driverId,
        documentType: createKycDocumentDto.documentType,
        status: { in: [KycDocumentStatus.PENDING, KycDocumentStatus.UNDER_REVIEW, KycDocumentStatus.VERIFIED] },
      },
    });

    if (existingDocument) {
      throw new ConflictException(`Document of type ${createKycDocumentDto.documentType} already exists and is ${existingDocument.status}`);
    }

    const kycDocument = await this.prisma.kycDocument.create({
      data: {
        driverId,
        documentType: createKycDocumentDto.documentType,
        fileUrl: createKycDocumentDto.fileUrl,
        fileKey: createKycDocumentDto.fileKey,
        fileName: createKycDocumentDto.fileName,
        fileSize: createKycDocumentDto.fileSize,
        mimeType: createKycDocumentDto.mimeType,
        status: KycDocumentStatus.PENDING,
        expiresAt: createKycDocumentDto.expiresAt,
      },
    });

    await this.auditService.log({
      userId,
      action: 'CREATE',
      entityType: 'KYC_DOCUMENT',
      entityId: kycDocument.id,
      newValue: { documentType: kycDocument.documentType, driverId },
    });

    return kycDocument;
  }

  async findDriverKycDocuments(driverId: string, filterDto?: KycDocumentFilterDto) {
    const where: any = { driverId };
    
    if (filterDto?.status) where.status = filterDto.status;
    if (filterDto?.documentType) where.documentType = filterDto.documentType;

    const documents = await this.prisma.kycDocument.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return documents;
  }

  async findPendingKycDocuments(filterDto?: KycDocumentFilterDto) {
    const where: any = { status: KycDocumentStatus.PENDING };
    
    if (filterDto?.documentType) where.documentType = filterDto.documentType;
    if (filterDto?.driverId) where.driverId = filterDto.driverId;

    const documents = await this.prisma.kycDocument.findMany({
      where,
      include: {
        driver: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return documents;
  }

  async updateKycDocument(documentId: string, updateKycDocumentDto: UpdateKycDocumentDto, userId: string) {
    const document = await this.prisma.kycDocument.findUnique({
      where: { id: documentId },
      include: { driver: true },
    });

    if (!document) {
      throw new NotFoundException('KYC document not found');
    }

    const updateData: any = {};
    if (updateKycDocumentDto.status !== undefined) {
      updateData.status = updateKycDocumentDto.status;
      updateData.reviewedAt = new Date();
      updateData.reviewedBy = userId;
    }
    if (updateKycDocumentDto.rejectionReason !== undefined) {
      updateData.rejectionReason = updateKycDocumentDto.rejectionReason;
    }
    if (updateKycDocumentDto.expiresAt !== undefined) {
      updateData.expiresAt = updateKycDocumentDto.expiresAt;
    }

    const updatedDocument = await this.prisma.kycDocument.update({
      where: { id: documentId },
      data: updateData,
    });

    // Update driver KYC status based on document reviews
    await this.updateDriverKycStatus(document.driverId);

    await this.auditService.log({
      userId,
      action: 'UPDATE',
      entityType: 'KYC_DOCUMENT',
      entityId: documentId,
      oldValue: { ...document },
      newValue: updateData,
    });

    return updatedDocument;
  }

  private async updateDriverKycStatus(driverId: string) {
    const documents = await this.prisma.kycDocument.findMany({
      where: { driverId },
    });

    if (documents.length === 0) {
      return;
    }

    const hasRejected = documents.some(d => d.status === KycDocumentStatus.REJECTED);
    const hasPending = documents.some(d => d.status === KycDocumentStatus.PENDING || d.status === KycDocumentStatus.UNDER_REVIEW);
    const allVerified = documents.every(d => d.status === KycDocumentStatus.VERIFIED);

    let newKycStatus: KycStatus;
    if (hasRejected) {
      newKycStatus = KycStatus.REJECTED;
    } else if (hasPending) {
      newKycStatus = KycStatus.PENDING;
    } else if (allVerified) {
      newKycStatus = KycStatus.VERIFIED;
    } else {
      newKycStatus = KycStatus.PENDING;
    }

    await this.prisma.driver.update({
      where: { id: driverId },
      data: { kycStatus: newKycStatus },
    });
  }

  async findKycDocumentById(documentId: string) {
    const document = await this.prisma.kycDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('KYC document not found');
    }

    return document;
  }

  async deleteKycDocument(documentId: string, userId: string) {
    const document = await this.prisma.kycDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('KYC document not found');
    }

    if (document.status === KycDocumentStatus.VERIFIED) {
      throw new BadRequestException('Cannot delete verified documents');
    }

    if (document.fileKey) {
      await this.storageService.delete(document.fileKey);
    }

    await this.prisma.kycDocument.delete({
      where: { id: documentId },
    });

    await this.auditService.log({
      userId,
      action: 'DELETE',
      entityType: 'KYC_DOCUMENT',
      entityId: documentId,
      oldValue: { documentType: document.documentType, driverId: document.driverId, fileKey: document.fileKey },
    });

    return { message: 'Document deleted successfully' };
  }
}
