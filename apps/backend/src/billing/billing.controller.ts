import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BillingService } from './billing.service';
import { CreateRateCardDto } from './dto/create-rate-card.dto';
import { UpdateRateCardDto } from './dto/update-rate-card.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { BillingEstimateDto } from './dto/billing-estimate.dto';
import { UserRole, InvoiceStatus } from '@prisma/client';

@ApiTags('billing')
@ApiBearerAuth('access-token')
@Controller('billing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BillingController {
  constructor(private billingService: BillingService) {}

  // Rate Cards
  @Get('rate-cards')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  getRateCards() {
    return this.billingService.getRateCards();
  }

  @Post('rate-cards')
  @Roles(UserRole.SUPER_ADMIN)
  createRateCard(
    @Body() dto: CreateRateCardDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.billingService.createRateCard(dto, user.userId);
  }

  @Patch('rate-cards/:id')
  @Roles(UserRole.SUPER_ADMIN)
  updateRateCard(
    @Param('id') id: string,
    @Body() dto: UpdateRateCardDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.billingService.updateRateCard(id, dto, user.userId);
  }

  @Post('rate-cards/:id/activate')
  @Roles(UserRole.SUPER_ADMIN)
  activateRateCard(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.billingService.activateRateCard(id, user.userId);
  }

  // Invoices
  @Get('invoices')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  getInvoices(
    @Query('status') status?: InvoiceStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.billingService.getInvoices({
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('invoices/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS, UserRole.CLIENT)
  getInvoice(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string; role: UserRole },
  ) {
    return this.billingService.getInvoice(id, user.userId, user.role);
  }

  @Post('invoices/:id/issue')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  issueInvoice(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.billingService.issueInvoice(id, user.userId);
  }

  @Post('invoices/:id/mark-paid')
  @Roles(UserRole.SUPER_ADMIN)
  markPaid(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.billingService.markPaid(id, user.userId);
  }

  @Post('invoices/:id/void')
  @Roles(UserRole.SUPER_ADMIN)
  voidInvoice(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.billingService.voidInvoice(id, user.userId);
  }

  @Patch('invoices/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS)
  updateInvoice(
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.billingService.updateInvoice(id, dto, user.userId);
  }

  // Quotes & Estimates
  @Get('quote/:orderId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS, UserRole.CLIENT)
  getQuote(@Param('orderId') orderId: string) {
    return this.billingService.getQuote(orderId);
  }

  @Post('estimate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS, UserRole.CLIENT)
  getEstimate(@Body() dto: BillingEstimateDto) {
    return this.billingService.getEstimate(dto);
  }

  // Order Invoice
  @Get('orders/:orderId/invoice')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OPERATIONS, UserRole.CLIENT)
  getOrderInvoice(@Param('orderId') orderId: string) {
    return this.billingService.getOrderInvoice(orderId);
  }
}
