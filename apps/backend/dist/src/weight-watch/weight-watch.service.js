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
exports.WeightWatchService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let WeightWatchService = class WeightWatchService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async validateTripWeight(cargoWeight, vehicleId, handlingTags) {
        const vehicle = await this.prisma.vehicle.findUnique({
            where: { id: vehicleId },
        });
        if (!vehicle) {
            return {
                canAssign: false,
                reason: 'Vehicle not found',
                utilization: 0,
                status: client_1.WeightStatus.OVERLOADED,
                cargoCompatibility: 'INCOMPATIBLE',
                requiresPartitionedVehicle: false,
            };
        }
        const utilization = cargoWeight / vehicle.capacityKg;
        let status;
        if (utilization <= 0.8) {
            status = client_1.WeightStatus.SAFE;
        }
        else if (utilization <= 0.95) {
            status = client_1.WeightStatus.WARNING;
        }
        else if (utilization <= 1.0) {
            status = client_1.WeightStatus.NEAR_CAPACITY;
        }
        else {
            status = client_1.WeightStatus.OVERLOADED;
        }
        const compatibilityCheck = this.checkCargoCompatibility(handlingTags);
        const requiresPartitionedVehicle = this.requiresPartitionedVehicle(handlingTags);
        if (requiresPartitionedVehicle && !vehicle.isPartitioned) {
            return {
                canAssign: false,
                reason: 'This cargo requires a partitioned vehicle for mixed goods',
                utilization,
                status,
                cargoCompatibility: compatibilityCheck.compatibility,
                requiresPartitionedVehicle: true,
            };
        }
        if (!compatibilityCheck.isCompatible) {
            return {
                canAssign: false,
                reason: compatibilityCheck.reason,
                utilization,
                status,
                cargoCompatibility: 'INCOMPATIBLE',
                requiresPartitionedVehicle,
            };
        }
        if (status === client_1.WeightStatus.OVERLOADED) {
            return {
                canAssign: false,
                reason: `Cargo weight (${cargoWeight}kg) exceeds vehicle capacity (${vehicle.capacityKg}kg)`,
                utilization,
                status,
                cargoCompatibility: 'COMPATIBLE',
                requiresPartitionedVehicle,
            };
        }
        return {
            canAssign: true,
            utilization,
            status,
            cargoCompatibility: 'COMPATIBLE',
            requiresPartitionedVehicle,
        };
    }
    async createWeightRecord(tripId, orderId, cargoWeight, vehicleCapacity) {
        const utilization = cargoWeight / vehicleCapacity;
        let status;
        if (utilization <= 0.8)
            status = client_1.WeightStatus.SAFE;
        else if (utilization <= 0.95)
            status = client_1.WeightStatus.WARNING;
        else if (utilization <= 1.0)
            status = client_1.WeightStatus.NEAR_CAPACITY;
        else
            status = client_1.WeightStatus.OVERLOADED;
        return this.prisma.weightRecord.create({
            data: {
                tripId,
                orderId,
                cargoWeight,
                vehicleCapacity,
                utilization,
                status,
            },
        });
    }
    async getWeightAlerts() {
        return this.prisma.weightRecord.findMany({
            where: {
                status: { in: [client_1.WeightStatus.WARNING, client_1.WeightStatus.NEAR_CAPACITY, client_1.WeightStatus.OVERLOADED] },
            },
            include: {
                trip: {
                    include: {
                        order: {
                            select: {
                                orderNumber: true,
                            },
                        },
                        driver: {
                            include: {
                                user: {
                                    select: {
                                        firstName: true,
                                        lastName: true,
                                    },
                                },
                            },
                        },
                        vehicle: true,
                    },
                },
            },
            orderBy: { checkedAt: 'desc' },
            take: 50,
        });
    }
    checkCargoCompatibility(handlingTags) {
        const hasFragile = handlingTags.includes(client_1.HandlingTagType.FRAGILE);
        const hasHeavy = handlingTags.includes(client_1.HandlingTagType.HEAVY);
        const hasChemical = handlingTags.includes(client_1.HandlingTagType.CHEMICAL);
        const hasHazardous = handlingTags.includes(client_1.HandlingTagType.HAZARDOUS);
        if (hasHeavy && hasFragile) {
            return {
                isCompatible: true,
                compatibility: 'COMPATIBLE',
                reason: 'Heavy and fragile cargo requires partitioned vehicle',
            };
        }
        if (hasChemical && hasHazardous) {
            return {
                isCompatible: false,
                compatibility: 'INCOMPATIBLE',
                reason: 'Chemical and hazardous materials cannot be transported together',
            };
        }
        return {
            isCompatible: true,
            compatibility: 'COMPATIBLE',
        };
    }
    requiresPartitionedVehicle(handlingTags) {
        const hasFragile = handlingTags.includes(client_1.HandlingTagType.FRAGILE);
        const hasHeavy = handlingTags.includes(client_1.HandlingTagType.HEAVY);
        const hasChemical = handlingTags.includes(client_1.HandlingTagType.CHEMICAL);
        return (hasFragile && hasHeavy) || (hasFragile && hasChemical);
    }
};
exports.WeightWatchService = WeightWatchService;
exports.WeightWatchService = WeightWatchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WeightWatchService);
//# sourceMappingURL=weight-watch.service.js.map