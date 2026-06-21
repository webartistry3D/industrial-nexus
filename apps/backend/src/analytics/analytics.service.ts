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

  async getDeliveryTrends(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const rows: Array<{ day: Date; delivered: bigint; delayed: bigint; cancelled: bigint }> =
      await this.prisma.$queryRaw`
        SELECT
          DATE_TRUNC('day', completed_at) AS day,
          COUNT(*) FILTER (WHERE status = 'DELIVERED')  AS delivered,
          COUNT(*) FILTER (WHERE status = 'CANCELLED')  AS cancelled,
          COUNT(*) FILTER (
            WHERE status = 'DELIVERED'
              AND eta IS NOT NULL
              AND completed_at > eta
          ) AS delayed
        FROM trips
        WHERE completed_at >= ${since}
          AND completed_at IS NOT NULL
        GROUP BY 1
        ORDER BY 1 ASC
      `;

    return rows.map(r => ({
      date: r.day.toISOString().split('T')[0],
      delivered: Number(r.delivered),
      delayed: Number(r.delayed),
      cancelled: Number(r.cancelled),
    }));
  }

  async getDriverPerformance() {
    const drivers = await this.prisma.driver.findMany({
      where: { status: 'ACTIVE' },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        trips: {
          select: {
            id: true,
            status: true,
            startedAt: true,
            completedAt: true,
            eta: true,
          },
        },
      },
    });

    return drivers.map((driver) => {
      const totalTrips = driver.trips.length;
      const delivered = driver.trips.filter(t => t.status === 'DELIVERED').length;
      const inTransit = driver.trips.filter(t => t.status === 'IN_TRANSIT').length;
      const cancelled = driver.trips.filter(t => t.status === 'CANCELLED').length;

      // Delayed: completed trips where completedAt > eta, or in-transit trips started > 11h ago
      const delayed = driver.trips.filter(t => {
        if (t.status === 'DELIVERED' && t.completedAt && t.eta) {
          return new Date(t.completedAt) > new Date(t.eta);
        }
        if (t.status === 'IN_TRANSIT' && t.startedAt) {
          return new Date(t.startedAt).getTime() < Date.now() - 11 * 60 * 60 * 1000;
        }
        return false;
      }).length;

      const completedTrips = delivered;
      const onTimeRate = completedTrips > 0
        ? Math.round(((completedTrips - delayed) / completedTrips) * 100)
        : null;

      // Average delivery duration (minutes) for completed trips
      const completedWithTimes = driver.trips.filter(
        t => t.status === 'DELIVERED' && t.startedAt && t.completedAt,
      );
      const avgDurationMinutes = completedWithTimes.length > 0
        ? Math.round(
            completedWithTimes.reduce((sum, t) => {
              return sum + (new Date(t.completedAt!).getTime() - new Date(t.startedAt!).getTime());
            }, 0) / completedWithTimes.length / 60000,
          )
        : null;

      return {
        driverId: driver.id,
        name: `${driver.user.firstName} ${driver.user.lastName}`,
        email: driver.user.email,
        licenseNumber: driver.licenseNumber,
        availability: driver.availability,
        totalTrips,
        delivered,
        inTransit,
        cancelled,
        delayed,
        onTimeRate,
        avgDurationMinutes,
      };
    });
  }
}
