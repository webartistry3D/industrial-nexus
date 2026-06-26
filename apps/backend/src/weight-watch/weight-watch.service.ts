import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WeightStatus } from '@prisma/client';

export interface WeightValidationResult {
  canAssign: boolean;
  reason?: string;
  utilization: number;
  status: WeightStatus;
  cargoCompatibility: 'COMPATIBLE' | 'INCOMPATIBLE';
  requiresPartitionedVehicle: boolean;
}

@Injectable()
export class WeightWatchService {
  constructor(private prisma: PrismaService) {}

  async validateTripWeight(
    cargoWeight: number,
    vehicleId: string,
    handlingTags: string[],
  ): Promise<WeightValidationResult> {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      return {
        canAssign: false,
        reason: 'Vehicle not found',
        utilization: 0,
        status: WeightStatus.OVERLOADED,
        cargoCompatibility: 'INCOMPATIBLE',
        requiresPartitionedVehicle: false,
      };
    }

    const utilization = cargoWeight / vehicle.capacityKg;
    let status: WeightStatus;

    if (utilization <= 0.7) {
      status = WeightStatus.SAFE;
    } else if (utilization <= 0.85) {
      status = WeightStatus.WARNING;
    } else if (utilization <= 0.94) {
      status = WeightStatus.NEAR_CAPACITY;
    } else {
      status = WeightStatus.OVERLOADED;
    }

    // Check cargo compatibility
    const compatibilityCheck = this.checkCargoCompatibility(handlingTags);

    // Check if partitioned vehicle required
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

    if (status === WeightStatus.NEAR_CAPACITY || status === WeightStatus.OVERLOADED) {
      return {
        canAssign: false,
        reason: `Cargo weight (${cargoWeight}kg) at ${(utilization * 100).toFixed(1)}% utilization exceeds the safe limit for vehicle capacity (${vehicle.capacityKg}kg)`,
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

  async createWeightRecord(
    tripId: string,
    orderId: string,
    cargoWeight: number,
    vehicleCapacity: number,
  ) {
    const utilization = cargoWeight / vehicleCapacity;
    
    let status: WeightStatus;
    if (utilization <= 0.7) status = WeightStatus.SAFE;
    else if (utilization <= 0.85) status = WeightStatus.WARNING;
    else if (utilization <= 0.94) status = WeightStatus.NEAR_CAPACITY;
    else status = WeightStatus.OVERLOADED;

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

  private calculateStatus(utilization: number): WeightStatus {
    if (utilization <= 0.7) return WeightStatus.SAFE;
    if (utilization <= 0.85) return WeightStatus.WARNING;
    if (utilization <= 0.94) return WeightStatus.NEAR_CAPACITY;
    return WeightStatus.OVERLOADED;
  }

  async getWeightAlerts() {
    const records = await this.prisma.weightRecord.findMany({
      where: {
        utilization: { gt: 0.7 },
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

    return records
      .map(record => ({
        ...record,
        status: this.calculateStatus(record.utilization),
      }))
      .filter(record => record.status !== WeightStatus.SAFE);
  }

  private checkCargoCompatibility(handlingTags: string[]): { 
    isCompatible: boolean; 
    compatibility: 'COMPATIBLE' | 'INCOMPATIBLE';
    reason?: string 
  } {
    const hasFragile = handlingTags.includes('FRAGILE');
    const hasHeavy = handlingTags.includes('HEAVY');
    const hasChemical = handlingTags.includes('CHEMICAL');
    const hasHazardous = handlingTags.includes('HAZARDOUS');

    // Heavy + Fragile = Requires partitioned vehicle
    if (hasHeavy && hasFragile) {
      return {
        isCompatible: true,
        compatibility: 'COMPATIBLE',
        reason: 'Heavy and fragile cargo requires partitioned vehicle',
      };
    }

    // Chemical + Hazardous combinations
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

  private requiresPartitionedVehicle(handlingTags: string[]): boolean {
    const hasFragile = handlingTags.includes('FRAGILE');
    const hasHeavy = handlingTags.includes('HEAVY');
    const hasChemical = handlingTags.includes('CHEMICAL');

    // Mixed cargo scenarios requiring partitioning
    return (hasFragile && hasHeavy) || (hasFragile && hasChemical);
  }
}
