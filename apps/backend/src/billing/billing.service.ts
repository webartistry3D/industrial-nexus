import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ValhallaService, LatLng } from '../maps/valhalla.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  Prisma,
  RateCard,
  Invoice,
  InvoiceStatus,
  Order,
  Priority,
  UserRole,
  AuditAction,
  NotificationType,
} from '@prisma/client';
import { CreateRateCardDto } from './dto/create-rate-card.dto';
import { UpdateRateCardDto } from './dto/update-rate-card.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { BillingEstimateDto } from './dto/billing-estimate.dto';

export interface InvoiceBreakdown {
  distanceKm: number;
  baseFreightCharge: number;
  weightCharge: number;
  handlingSurcharges: Record<string, number>;
  priorityMultiplier: number;
  subtotal: number;
  insurancePremium: number;
  vatAmount: number;
  totalAmount: number;
}

const HANDLING_TAG_SURCHARGE_MAP: Record<string, keyof RateCard> = {
  HEAVY: 'heavySurcharge',
  FRAGILE: 'fragileSurcharge',
  HAZARDOUS: 'hazardousSurcharge',
  CHEMICAL: 'chemicalSurcharge',
  TEMPERATURE_SENSITIVE: 'temperatureSensitiveSurcharge',
  VERTICAL_STORAGE_REQUIRED: 'verticalStorageSurcharge',
};

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private prisma: PrismaService,
    private valhallaService: ValhallaService,
    private auditService: AuditService,
    private notificationsService: NotificationsService,
  ) {}

  // ==================== Rate Cards ====================

  async getActiveRateCard(): Promise<RateCard> {
    const rateCard = await this.prisma.rateCard.findFirst({
      where: { isActive: true },
    });

    if (!rateCard) {
      throw new NotFoundException(
        'No active rate card configured. Please set up a rate card in Settings.',
      );
    }

    return rateCard;
  }

  async getRateCards(): Promise<RateCard[]> {
    return this.prisma.rateCard.findMany({
      orderBy: { createdAt: 'desc' },
      include: { createdBy: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
  }

  async createRateCard(dto: CreateRateCardDto, userId: string): Promise<RateCard> {
    const multipliers = dto.priorityMultipliers as unknown as Record<string, number>;
    for (const key of ['LOW', 'NORMAL', 'HIGH', 'URGENT']) {
      if (multipliers[key] === undefined || multipliers[key] === null) {
        throw new BadRequestException(`Missing priority multiplier for ${key}`);
      }
    }

    const rateCard = await this.prisma.rateCard.create({
      data: {
        ...dto,
        isActive: false,
        createdById: userId,
        priorityMultipliers: dto.priorityMultipliers as unknown as Prisma.InputJsonValue,
      },
    });

    await this.auditService.log({
      userId,
      action: AuditAction.CREATE,
      entityType: 'RATE_CARD',
      entityId: rateCard.id,
      newValue: dto,
    });

    return rateCard;
  }

  async activateRateCard(id: string, userId: string): Promise<RateCard> {
    const rateCard = await this.prisma.rateCard.findUnique({ where: { id } });
    if (!rateCard) {
      throw new NotFoundException('Rate card not found');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.rateCard.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });

      return tx.rateCard.update({
        where: { id },
        data: { isActive: true },
      });
    });

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'RATE_CARD',
      entityId: updated.id,
      newValue: { isActive: true },
      oldValue: { isActive: rateCard.isActive },
    });

    return updated;
  }

  async updateRateCard(id: string, dto: UpdateRateCardDto, userId: string): Promise<RateCard> {
    const rateCard = await this.prisma.rateCard.findUnique({ where: { id } });
    if (!rateCard) {
      throw new NotFoundException('Rate card not found');
    }

    if (rateCard.isActive) {
      throw new BadRequestException('Deactivate the rate card before editing');
    }

    const updateData: Prisma.RateCardUpdateInput = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.baseRatePerKm !== undefined) updateData.baseRatePerKm = dto.baseRatePerKm;
    if (dto.baseRatePerKg !== undefined) updateData.baseRatePerKg = dto.baseRatePerKg;
    if (dto.minimumCharge !== undefined) updateData.minimumCharge = dto.minimumCharge;
    if (dto.priorityMultipliers !== undefined) {
      updateData.priorityMultipliers = dto.priorityMultipliers as unknown as Prisma.InputJsonValue;
    }
    if (dto.heavySurcharge !== undefined) updateData.heavySurcharge = dto.heavySurcharge;
    if (dto.fragileSurcharge !== undefined) updateData.fragileSurcharge = dto.fragileSurcharge;
    if (dto.hazardousSurcharge !== undefined) updateData.hazardousSurcharge = dto.hazardousSurcharge;
    if (dto.chemicalSurcharge !== undefined) updateData.chemicalSurcharge = dto.chemicalSurcharge;
    if (dto.temperatureSensitiveSurcharge !== undefined)
      updateData.temperatureSensitiveSurcharge = dto.temperatureSensitiveSurcharge;
    if (dto.verticalStorageSurcharge !== undefined)
      updateData.verticalStorageSurcharge = dto.verticalStorageSurcharge;
    if (dto.insuranceRatePercent !== undefined)
      updateData.insuranceRatePercent = dto.insuranceRatePercent;
    if (dto.vatPercent !== undefined) updateData.vatPercent = dto.vatPercent;

    const updated = await this.prisma.rateCard.update({
      where: { id },
      data: updateData,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'RATE_CARD',
      entityId: updated.id,
      oldValue: rateCard,
      newValue: updateData,
    });

    return updated;
  }

  // ==================== Distance ====================

  async calculateDistance(
    pickupLat: number,
    pickupLng: number,
    deliveryLat: number,
    deliveryLng: number,
  ): Promise<number> {
    const origin: LatLng = { lat: pickupLat, lng: pickupLng };
    const destination: LatLng = { lat: deliveryLat, lng: deliveryLng };

    try {
      const route = await this.valhallaService.getRoute(origin, destination);
      if (route?.distanceMeters) {
        return route.distanceMeters / 1000;
      }
    } catch (err: any) {
      this.logger.warn(`Valhalla route failed: ${err.message}`);
    }

    return this.haversineKm(pickupLat, pickupLng, deliveryLat, deliveryLng) * 1.3;
  }

  private haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }

  // ==================== Calculation ====================

  computeInvoiceBreakdown(
    distanceKm: number,
    totalWeight: number,
    priority: Priority,
    handlingTags: string[],
    declaredCargoValue: number | null | undefined,
    rateCard: RateCard,
  ): InvoiceBreakdown {
    const baseFreightCharge = distanceKm * rateCard.baseRatePerKm;
    const weightCharge = totalWeight * rateCard.baseRatePerKg;
    const rawSubtotal = Math.max(baseFreightCharge + weightCharge, rateCard.minimumCharge);

    const priorityMultipliers = rateCard.priorityMultipliers as Record<string, number>;
    const priorityMultiplier = priorityMultipliers[priority] ?? 1;

    const handlingSurcharges: Record<string, number> = {};
    for (const tag of handlingTags) {
      const surchargeField = HANDLING_TAG_SURCHARGE_MAP[tag];
      if (surchargeField) {
        const surchargeRate = rateCard[surchargeField] as number;
        handlingSurcharges[tag] = rawSubtotal * surchargeRate;
      }
    }

    const totalHandlingSurcharge = Object.values(handlingSurcharges).reduce(
      (sum, val) => sum + val,
      0,
    );

    const subtotal = (rawSubtotal + totalHandlingSurcharge) * priorityMultiplier;

    const insurancePremium = declaredCargoValue
      ? declaredCargoValue * rateCard.insuranceRatePercent
      : subtotal * rateCard.insuranceRatePercent;

    const vatAmount = (subtotal + insurancePremium) * rateCard.vatPercent;
    const totalAmount = subtotal + insurancePremium + vatAmount;

    return {
      distanceKm,
      baseFreightCharge,
      weightCharge,
      handlingSurcharges,
      priorityMultiplier,
      subtotal,
      insurancePremium,
      vatAmount,
      totalAmount,
    };
  }

  async getQuote(orderId: string): Promise<InvoiceBreakdown> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { handlingTags: { include: { tag: true } } },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const rateCard = await this.getActiveRateCard();
    const distanceKm = await this.calculateDistanceForOrder(order);
    const handlingTags = order.handlingTags.map((ht) => ht.tag.name);

    return this.computeInvoiceBreakdown(
      distanceKm,
      order.totalWeight,
      order.priority,
      handlingTags,
      order.declaredCargoValue,
      rateCard,
    );
  }

  async getEstimate(dto: BillingEstimateDto): Promise<InvoiceBreakdown> {
    const rateCard = await this.getActiveRateCard();
    const distanceKm = await this.calculateDistance(
      dto.pickupLat,
      dto.pickupLng,
      dto.deliveryLat,
      dto.deliveryLng,
    );

    return this.computeInvoiceBreakdown(
      distanceKm,
      dto.totalWeight,
      dto.priority,
      dto.handlingTags,
      dto.declaredCargoValue,
      rateCard,
    );
  }

  // ==================== Invoice Lifecycle ====================

  async generateInvoice(orderId: string): Promise<Invoice> {
    const existing = await this.prisma.invoice.findUnique({
      where: { orderId },
    });

    if (existing) {
      return existing;
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { handlingTags: { include: { tag: true } }, client: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const rateCard = await this.getActiveRateCard();
    const distanceKm = await this.calculateDistanceForOrder(order);
    const handlingTags = order.handlingTags.map((ht) => ht.tag.name);

    const breakdown = this.computeInvoiceBreakdown(
      distanceKm,
      order.totalWeight,
      order.priority,
      handlingTags,
      order.declaredCargoValue,
      rateCard,
    );

    const invoiceNumber = await this.generateInvoiceNumber();

    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber,
        orderId,
        rateCardId: rateCard.id,
        distanceKm: breakdown.distanceKm,
        baseFreightCharge: breakdown.baseFreightCharge,
        weightCharge: breakdown.weightCharge,
        handlingSurcharges: breakdown.handlingSurcharges as Prisma.InputJsonValue,
        priorityMultiplier: breakdown.priorityMultiplier,
        subtotal: breakdown.subtotal,
        insurancePremium: breakdown.insurancePremium,
        vatAmount: breakdown.vatAmount,
        totalAmount: breakdown.totalAmount,
        status: InvoiceStatus.DRAFT,
      },
    });

    await this.auditService.log({
      action: AuditAction.CREATE,
      entityType: 'INVOICE',
      entityId: invoice.id,
      newValue: { invoiceNumber, orderId, totalAmount: breakdown.totalAmount },
    });

    try {
      await this.notificationsService.create({
        userId: order.clientId,
        type: NotificationType.INVOICE_GENERATED,
        title: 'Invoice Generated',
        message: `Invoice ${invoiceNumber} for order ${order.orderNumber} has been generated. Total: ₦${breakdown.totalAmount.toLocaleString()}`,
        entityId: invoice.id,
        entityType: 'INVOICE',
      });
    } catch (err: any) {
      this.logger.warn(`Failed to send invoice notification: ${err.message}`);
    }

    return invoice;
  }

  async issueInvoice(id: string, userId: string): Promise<Invoice> {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT invoices can be issued');
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.ISSUED,
        issuedAt: new Date(),
        dueDate,
      },
    });

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'INVOICE',
      entityId: updated.id,
      oldValue: { status: invoice.status },
      newValue: { status: updated.status, issuedAt: updated.issuedAt, dueDate: updated.dueDate },
    });

    return updated;
  }

  async markPaid(id: string, userId: string): Promise<Invoice> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { order: { select: { clientId: true, orderNumber: true } } },
    });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status !== InvoiceStatus.ISSUED) {
      throw new BadRequestException('Only ISSUED invoices can be marked as paid');
    }

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.PAID,
        paidAt: new Date(),
      },
    });

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'INVOICE',
      entityId: updated.id,
      oldValue: { status: invoice.status },
      newValue: { status: updated.status, paidAt: updated.paidAt },
    });

    try {
      await this.notificationsService.create({
        userId: invoice.order.clientId,
        type: NotificationType.INVOICE_PAID,
        title: 'Invoice Paid',
        message: `Invoice ${invoice.invoiceNumber} for order ${invoice.order.orderNumber} has been marked as paid.`,
        entityId: invoice.id,
        entityType: 'INVOICE',
      });
    } catch (err: any) {
      this.logger.warn(`Failed to send invoice paid notification: ${err.message}`);
    }

    return updated;
  }

  async voidInvoice(id: string, userId: string): Promise<Invoice> {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Cannot void a paid invoice');
    }

    if (invoice.status === InvoiceStatus.VOID) {
      throw new BadRequestException('Invoice is already void');
    }

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.VOID },
    });

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'INVOICE',
      entityId: updated.id,
      oldValue: { status: invoice.status },
      newValue: { status: updated.status },
    });

    return updated;
  }

  async getInvoice(
    id: string,
    userId: string,
    userRole: UserRole,
  ): Promise<Invoice & { order: any; rateCard: RateCard }> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        order: { include: { client: { select: { id: true, firstName: true, lastName: true, email: true } } } },
        rateCard: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (userRole === UserRole.CLIENT && invoice.order.clientId !== userId) {
      throw new ForbiddenException('You do not have access to this invoice');
    }

    return invoice as Invoice & { order: any; rateCard: RateCard };
  }

  async getInvoices(params: {
    status?: InvoiceStatus;
    page?: number;
    limit?: number;
  }): Promise<{ data: (Invoice & { order: any; rateCard: RateCard })[]; meta: any }> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 10;
    const skip = (page - 1) * limit;
    const where: Prisma.InvoiceWhereInput = {};

    if (params.status) {
      where.status = params.status;
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            include: {
              client: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
          },
          rateCard: true,
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      data: invoices as (Invoice & { order: any; rateCard: RateCard })[],
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getOrderInvoice(orderId: string): Promise<Invoice | null> {
    return this.prisma.invoice.findUnique({
      where: { orderId },
      include: { rateCard: true },
    });
  }

  async updateInvoice(id: string, dto: UpdateInvoiceDto, userId: string): Promise<Invoice> {
    const invoice = await this.prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const updateData: Prisma.InvoiceUpdateInput = {};
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.dueDate !== undefined) updateData.dueDate = new Date(dto.dueDate);

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: updateData,
    });

    await this.auditService.log({
      userId,
      action: AuditAction.UPDATE,
      entityType: 'INVOICE',
      entityId: updated.id,
      oldValue: { notes: invoice.notes, dueDate: invoice.dueDate },
      newValue: updateData,
    });

    return updated;
  }

  // ==================== Helpers ====================

  private async calculateDistanceForOrder(order: Order): Promise<number> {
    const pickup = order.pickupLocation as any;
    const delivery = order.deliveryLocation as any;

    return this.calculateDistance(
      pickup?.lat ?? 0,
      pickup?.lng ?? 0,
      delivery?.lat ?? 0,
      delivery?.lng ?? 0,
    );
  }

  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `IN-INV-${year}-`;

    const lastInvoice = await this.prisma.invoice.findFirst({
      where: { invoiceNumber: { startsWith: prefix } },
      orderBy: { invoiceNumber: 'desc' },
    });

    let nextNumber = 1;
    if (lastInvoice) {
      const parts = lastInvoice.invoiceNumber.split('-');
      const lastNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNum)) {
        nextNumber = lastNum + 1;
      }
    }

    return `${prefix}${nextNumber.toString().padStart(6, '0')}`;
  }
}
