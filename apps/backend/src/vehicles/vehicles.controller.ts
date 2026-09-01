import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { VehiclesService } from './vehicles.service';
import { StorageService } from '../storage/storage.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleFilterDto } from './dto/vehicle-filter.dto';
import { CreateVehicleDocumentDto, UpdateVehicleDocumentDto, VehicleDocumentFilterDto } from './dto/vehicle-document.dto';
import { UserRole } from '@prisma/client';

@ApiTags('vehicles')
@ApiBearerAuth('access-token')
@Controller('vehicles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VehiclesController {
  constructor(
    private readonly vehiclesService: VehiclesService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createVehicleDto: CreateVehicleDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.vehiclesService.create(createVehicleDto, user.userId);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  findAll(@Query() filterDto: VehicleFilterDto) {
    return this.vehiclesService.findAll(filterDto);
  }

  @Get('available')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  findAvailable() {
    return this.vehiclesService.findAll({ status: 'ACTIVE', limit: 100 });
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  findOne(@Param('id') id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  update(
    @Param('id') id: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.vehiclesService.update(id, updateVehicleDto, user.userId);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  deactivate(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.vehiclesService.deactivate(id, user.userId);
  }

  // Vehicle Document Endpoints
  @Post(':id/documents/upload')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS, UserRole.DRIVER)
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png'];
      const ext = extname(file.originalname).toLowerCase();
      if (allowedTypes.includes(ext)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Only PDF, JPG, and PNG files are allowed'), false);
      }
    },
    limits: { fileSize: 10 * 1024 * 1024 },
  }))
  @HttpCode(HttpStatus.CREATED)
  async uploadVehicleDocument(
    @Param('id') vehicleId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('documentType') documentType: string,
    @Body('expiresAt') expiresAt: string,
    @CurrentUser() user: { userId: string },
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const { key: fileKey } = await this.storageService.upload(file, 'vehicle-docs');

    const createVehicleDocumentDto: CreateVehicleDocumentDto = {
      documentType: documentType as any,
      fileKey,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    };

    return this.vehiclesService.createVehicleDocument(vehicleId, createVehicleDocumentDto, user.userId);
  }

  @Post(':id/documents')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS, UserRole.DRIVER)
  @HttpCode(HttpStatus.CREATED)
  createVehicleDocument(
    @Param('id') vehicleId: string,
    @Body() createVehicleDocumentDto: CreateVehicleDocumentDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.vehiclesService.createVehicleDocument(vehicleId, createVehicleDocumentDto, user.userId);
  }

  @Get(':id/documents')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS, UserRole.DRIVER)
  findVehicleDocuments(
    @Param('id') vehicleId: string,
    @Query() filterDto?: VehicleDocumentFilterDto,
  ) {
    return this.vehiclesService.findVehicleDocuments(vehicleId, filterDto);
  }

  @Get('documents/pending')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  findPendingVehicleDocuments(
    @Query() filterDto?: VehicleDocumentFilterDto,
  ) {
    return this.vehiclesService.findPendingVehicleDocuments(filterDto);
  }

  @Patch('documents/:documentId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  updateVehicleDocument(
    @Param('documentId') documentId: string,
    @Body() updateVehicleDocumentDto: UpdateVehicleDocumentDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.vehiclesService.updateVehicleDocument(documentId, updateVehicleDocumentDto, user.userId);
  }

  @Get('documents/:documentId/signed-url')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS, UserRole.DRIVER)
  @HttpCode(HttpStatus.OK)
  async getVehicleDocumentSignedUrl(@Param('documentId') documentId: string) {
    const document = await this.vehiclesService.findOneVehicleDocument(documentId);
    if (document.fileKey) return this.storageService.getReadSignedUrl(document.fileKey);
    if (document.fileUrl) return { url: document.fileUrl, expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() };
    throw new NotFoundException('Vehicle document file not found');
  }

  @Delete('documents/:documentId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS, UserRole.DRIVER)
  deleteVehicleDocument(
    @Param('documentId') documentId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.vehiclesService.deleteVehicleDocument(documentId, user.userId);
  }
}
