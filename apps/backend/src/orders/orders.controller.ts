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
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderFilterDto } from './dto/order-filter.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { UserRole } from '@prisma/client';

@ApiTags('orders')
@ApiBearerAuth('access-token')
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createOrderDto: CreateOrderDto,
    @CurrentUser() user: { userId: string; role: UserRole },
  ) {
    return this.ordersService.create(createOrderDto, user.userId, user.role);
  }

  @Get()
  findAll(
    @Query() filterDto: OrderFilterDto,
    @CurrentUser() user: { userId: string; role: UserRole },
  ) {
    try {
      console.log('[OrdersController] findAll called with filter:', filterDto, 'user:', user);
      return this.ordersService.findAll(filterDto, user.userId, user.role);
    } catch (error) {
      console.error('[OrdersController] Error in findAll:', error);
      throw error;
    }
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string; role: UserRole },
  ) {
    return this.ordersService.findOne(id, user.userId, user.role);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @CurrentUser() user: { userId: string; role: UserRole },
  ) {
    return this.ordersService.update(id, updateOrderDto, user.userId, user.role);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: { userId: string; role: UserRole },
  ) {
    return this.ordersService.cancel(id, user.userId, user.role, reason);
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  submit(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string; role: UserRole },
  ) {
    return this.ordersService.changeStatus(id, 'SUBMITTED', user.userId, user.role);
  }

  @Post(':id/approve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  @HttpCode(HttpStatus.OK)
  approve(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string; role: UserRole },
  ) {
    return this.ordersService.changeStatus(id, 'APPROVED', user.userId, user.role);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  reject(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: { userId: string; role: UserRole },
  ) {
    return this.ordersService.changeStatus(id, 'REJECTED', user.userId, user.role, reason);
  }

  @Post(':id/start-kitting')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  @HttpCode(HttpStatus.OK)
  startKitting(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string; role: UserRole },
  ) {
    return this.ordersService.changeStatus(id, 'KITTING', user.userId, user.role);
  }

  @Post(':id/finish-kitting')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  @HttpCode(HttpStatus.OK)
  finishKitting(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string; role: UserRole },
  ) {
    return this.ordersService.changeStatus(id, 'DISPATCH_READY', user.userId, user.role);
  }

  @Post(':id/assignDriver')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  @HttpCode(HttpStatus.OK)
  assignDriver(
    @Param('id') id: string,
    @Query('driverId') driverId: string,
    @CurrentUser() user: { userId: string; role: UserRole },
  ) {
    return this.ordersService.assignDriver(id, driverId, user.userId, user.role);
  }

  @Post(':id/start-trip')
  @HttpCode(HttpStatus.OK)
  startTrip(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string; role: UserRole },
  ) {
    return this.ordersService.changeStatus(id, 'IN_TRANSIT', user.userId, user.role);
  }

  @Post(':id/confirm-delivery')
  @HttpCode(HttpStatus.OK)
  confirmDelivery(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string; role: UserRole },
  ) {
    return this.ordersService.changeStatus(id, 'DELIVERED', user.userId, user.role);
  }

  @Post(':id/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  changeStatus(
    @Param('id') id: string,
    @Body() changeStatusDto: ChangeStatusDto,
    @CurrentUser() user: { userId: string; role: UserRole },
  ) {
    return this.ordersService.changeStatus(
      id,
      changeStatusDto.status,
      user.userId,
      user.role,
      changeStatusDto.notes,
      changeStatusDto.driverId,
      changeStatusDto.vehicleId,
    );
  }
}
