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
} from '@nestjs/common';
import { TripsService } from './trips.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateTripDto } from './dto/create-trip.dto';
import { TripFilterDto } from './dto/trip-filter.dto';
import { AssignDriverDto } from './dto/assign-driver.dto';
import { UserRole } from '@prisma/client';

@Controller('trips')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

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

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
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
