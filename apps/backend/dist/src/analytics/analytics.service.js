"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AnalyticsService = class AnalyticsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboardStats() {
        const [activeTrips, pendingOrders, totalDrivers, availableVehicles, weightAlerts, delayedTrips,] = await Promise.all([
            this.prisma.trip.count({
                where: { status: 'IN_TRANSIT' },
            }),
            this.prisma.order.count({
                where: {
                    status: {
                        in: ['SUBMITTED', 'APPROVED', 'KITTING', 'DISPATCH_READY'],
                    },
                },
            }),
            this.prisma.driver.count({
                where: { status: 'ACTIVE' },
            }),
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
            this.prisma.weightRecord.count({
                where: {
                    status: { in: ['WARNING', 'NEAR_CAPACITY', 'OVERLOADED'] },
                },
            }),
            this.prisma.trip.count({
                where: {
                    status: 'IN_TRANSIT',
                    startedAt: {
                        lt: new Date(Date.now() - 11 * 60 * 60 * 1000),
                    },
                },
            }),
        ]);
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
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map