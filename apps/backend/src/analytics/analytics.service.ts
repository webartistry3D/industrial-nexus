import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      activeTrips,
      pendingOrders,
      totalDrivers,
      availableVehicles,
      weightAlerts,
      delayedTrips,
    ] = await Promise.all([
      // Active trips (IN_TRANSIT)
      this.prisma.trip.count({
        where: { status: 'IN_TRANSIT' },
      }),

      // Pending orders (SUBMITTED, APPROVED, KITTING, DISPATCH_READY)
      this.prisma.order.count({
        where: {
          status: {
            in: ['SUBMITTED', 'APPROVED', 'KITTING', 'DISPATCH_READY'],
          },
        },
      }),

      // Total active drivers
      this.prisma.driver.count({
        where: { status: 'ACTIVE' },
      }),

      // Available vehicles
      this.prisma.vehicle.count({
        where: {
          status: 'ACTIVE',
          trips: {
            none: {
              status: { in: ['ASSIGNED', 'IN_TRANSIT'] },
            },
          },
        },
      }),

      // Weight alerts (WARNING, NEAR_CAPACITY, OVERLOADED)
      this.prisma.weightRecord.count({
        where: {
          status: { in: ['WARNING', 'NEAR_CAPACITY', 'OVERLOADED'] },
        },
      }),

      // Delayed trips (in transit for more than 11 hours)
      this.prisma.trip.count({
        where: {
          status: 'IN_TRANSIT',
          startedAt: {
            lt: new Date(Date.now() - 11 * 60 * 60 * 1000), // 11 hours ago
          },
        },
      }),
    ]);

    // Calculate on-time delivery percentage
    const totalDelivered = await this.prisma.trip.count({
      where: { status: 'DELIVERED' },
    });

    const totalCompleted = totalDelivered + delayedTrips;
    const onTimeDelivery = totalCompleted > 0
      ? Math.round(((totalCompleted - delayedTrips) / totalCompleted) * 100)
      : 100;

    return {
      activeTrips,
      pendingOrders,
      totalDrivers,
      availableVehicles,
      weightAlerts,
      delayedTrips,
      onTimeDelivery,
    };
  }
}
