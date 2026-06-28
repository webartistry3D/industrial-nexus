import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TripsService } from './trips.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateTripDto } from './dto/create-trip.dto';
import { TripFilterDto } from './dto/trip-filter.dto';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { UserRole } from '@prisma/client';
import { StorageService } from '../storage/storage.service';

@ApiTags('trips')
@ApiBearerAuth('access-token')
@Controller('trips')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TripsController {
  constructor(
    private readonly tripsService: TripsService,
    private readonly storageService: StorageService,
  ) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createTripDto: CreateTripDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.tripsService.create(createTripDto, user.userId);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  findAll(@Query() filterDto: TripFilterDto) {
    return this.tripsService.findAll(filterDto);
  }

  @Get('my-trips')
  @Roles(UserRole.DRIVER)
  getMyTrips(@CurrentUser() user: { userId: string }) {
    return this.tripsService.findDriverTrips(user.userId);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS, UserRole.DRIVER)
  findOne(@Param('id') id: string) {
    return this.tripsService.findOne(id);
  }

  @Post(':id/start')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS, UserRole.DRIVER)
  @HttpCode(HttpStatus.OK)
  startTrip(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.tripsService.startTrip(id, user.userId);
  }

  @Post(':id/complete')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS, UserRole.DRIVER)
  @HttpCode(HttpStatus.OK)
  completeTrip(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.tripsService.completeTrip(id, user.userId);
  }

  @Post(':id/location')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS, UserRole.DRIVER)
  @HttpCode(HttpStatus.OK)
  updateLocation(
    @Param('id') id: string,
    @Body() locationData: { lat: number; lng: number; accuracy?: number },
  ) {
    return this.tripsService.updateLocation(id, locationData.lat, locationData.lng, locationData.accuracy);
  }

  @Get(':id/pod/upload-url')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS, UserRole.DRIVER)
  async getPodUploadUrl(
    @Param('id') id: string,
    @Query('filename') filename: string,
    @Query('mimeType') mimeType: string,
  ) {
    if (!filename || !mimeType) {
      throw new BadRequestException('filename and mimeType query params are required');
    }
    return this.storageService.getPresignedUploadUrl('pod-photos', filename, mimeType);
  }

  @Post(':id/pod')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS, UserRole.DRIVER)
  @HttpCode(HttpStatus.OK)
  submitPOD(
    @Param('id') id: string,
    @Body() podData: { photoUrl?: string; signatureUrl?: string; notes?: string; lat?: number; lng?: number },
    @CurrentUser() user: { userId: string },
  ) {
    return this.tripsService.submitPOD(id, podData, user.userId);
  }

  @Post(':id/checklist')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS, UserRole.DRIVER)
  @HttpCode(HttpStatus.OK)
  submitChecklist(
    @Param('id') id: string,
    @Body() checklist: {
      vehicleInspected: boolean;
      cargoSecured: boolean;
      handlingTagsVerified: boolean;
      safetyComplianceConfirmed: boolean;
    },
    @CurrentUser() user: { userId: string },
  ) {
    return this.tripsService.submitChecklist(id, checklist, user.userId);
  }

  @Post(':id/reassign')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  @HttpCode(HttpStatus.OK)
  reassignDriver(
    @Param('id') id: string,
    @Body() assignDriverDto: AssignDriverDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.tripsService.updateDriverAssignment(id, assignDriverDto, user.userId);
  }
}
