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
} from '@nestjs/common';
import { DriversService } from './drivers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { DriverFilterDto } from './dto/driver-filter.dto';
import { CreateKycDocumentDto, UpdateKycDocumentDto, KycDocumentFilterDto } from './dto/kyc-document.dto';
import { UserRole, DriverAvailability, KycDocumentType } from '@prisma/client';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { StorageService } from '../storage/storage.service';

@ApiTags('drivers')
@ApiBearerAuth('access-token')
@Controller('drivers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DriversController {
  constructor(
    private readonly driversService: DriversService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createDriverDto: CreateDriverDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.driversService.create(createDriverDto, user.userId);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  findAll(@Query() filterDto: DriverFilterDto) {
    return this.driversService.findAll(filterDto);
  }

  @Get('available')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  findAvailable() {
    return this.driversService.findAll({ availability: DriverAvailability.AVAILABLE, limit: 100 });
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  findOne(@Param('id') id: string) {
    return this.driversService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  update(
    @Param('id') id: string,
    @Body() updateDriverDto: UpdateDriverDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.driversService.update(id, updateDriverDto, user.userId);
  }

  @Post(':id/verify-kyc')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  @HttpCode(HttpStatus.OK)
  verifyKyc(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.driversService.verifyKyc(id, user.userId);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  deactivate(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.driversService.deactivate(id, user.userId);
  }

  // KYC Document Endpoints
  @Post(':id/kyc/documents/upload')
  @Roles(UserRole.DRIVER, UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
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
  async uploadKycDocument(
    @Param('id') driverId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('documentType') documentType: string,
    @CurrentUser() user: { userId: string },
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const { url: fileUrl } = await this.storageService.upload(file, 'kyc-docs');

    const createKycDocumentDto: CreateKycDocumentDto = {
      documentType: documentType as any,
      fileUrl,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
    };

    return this.driversService.createKycDocument(driverId, createKycDocumentDto, user.userId);
  }

  @Post(':id/kyc/documents')
  @Roles(UserRole.DRIVER, UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  @HttpCode(HttpStatus.CREATED)
  createKycDocument(
    @Param('id') driverId: string,
    @Body() createKycDocumentDto: CreateKycDocumentDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.driversService.createKycDocument(driverId, createKycDocumentDto, user.userId);
  }

  @Get(':id/kyc/documents')
  @Roles(UserRole.DRIVER, UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  findDriverKycDocuments(
    @Param('id') driverId: string,
    @Query() filterDto?: KycDocumentFilterDto,
  ) {
    return this.driversService.findDriverKycDocuments(driverId, filterDto);
  }

  @Get('kyc/pending')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  findPendingKycDocuments(@Query() filterDto?: KycDocumentFilterDto) {
    return this.driversService.findPendingKycDocuments(filterDto);
  }

  @Patch('kyc/documents/:documentId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  updateKycDocument(
    @Param('documentId') documentId: string,
    @Body() updateKycDocumentDto: UpdateKycDocumentDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.driversService.updateKycDocument(documentId, updateKycDocumentDto, user.userId);
  }

  @Delete('kyc/documents/:documentId')
  @Roles(UserRole.DRIVER, UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  @HttpCode(HttpStatus.OK)
  deleteKycDocument(
    @Param('documentId') documentId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.driversService.deleteKycDocument(documentId, user.userId);
  }
}
