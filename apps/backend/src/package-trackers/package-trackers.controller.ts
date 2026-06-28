import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PackageTrackersService } from './package-trackers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, PackageTrackerStatus } from '@prisma/client';
import { IsString, IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';

class CreatePackageTrackerDto {
  @IsString()
  deviceId: string;

  @IsOptional()
  @IsString()
  name?: string;
}

class UpdatePackageTrackerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(PackageTrackerStatus)
  status?: PackageTrackerStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  batteryLevel?: number;
}

@ApiTags('package-trackers')
@ApiBearerAuth('access-token')
@Controller('package-trackers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PackageTrackersController {
  constructor(private readonly packageTrackersService: PackageTrackersService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreatePackageTrackerDto,
    @CurrentUser() user: { userId: string; role: UserRole },
  ) {
    return this.packageTrackersService.create(dto, user.userId);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  findAll() {
    return this.packageTrackersService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  findOne(@Param('id') id: string) {
    return this.packageTrackersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePackageTrackerDto,
    @CurrentUser() user: { userId: string; role: UserRole },
  ) {
    return this.packageTrackersService.update(id, dto, user.userId);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string; role: UserRole },
  ) {
    return this.packageTrackersService.remove(id, user.userId);
  }
}
