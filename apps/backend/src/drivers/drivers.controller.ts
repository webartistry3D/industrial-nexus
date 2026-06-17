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
} from '@nestjs/common';
import { DriversService } from './drivers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { DriverFilterDto } from './dto/driver-filter.dto';
import { UserRole, DriverAvailability } from '@prisma/client';

@Controller('drivers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

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
}
