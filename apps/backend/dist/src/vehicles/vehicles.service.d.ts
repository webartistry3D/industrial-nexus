import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleFilterDto } from './dto/vehicle-filter.dto';
export declare class VehiclesService {
    private prisma;
    private auditService;
    constructor(prisma: PrismaService, auditService: AuditService);
    create(createVehicleDto: CreateVehicleDto, userId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.VehicleStatus;
        createdAt: Date;
        updatedAt: Date;
        plateNumber: string;
        category: import(".prisma/client").$Enums.VehicleCategory;
        capacityKg: number;
        isPartitioned: boolean;
    }>;
    findAll(filterDto: VehicleFilterDto): Promise<{
        data: ({
            drivers: {
                id: string;
                user: {
                    firstName: string;
                    lastName: string;
                };
            }[];
            _count: {
                trips: number;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.VehicleStatus;
            createdAt: Date;
            updatedAt: Date;
            plateNumber: string;
            category: import(".prisma/client").$Enums.VehicleCategory;
            capacityKg: number;
            isPartitioned: boolean;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        drivers: ({
            user: {
                id: string;
                firstName: string;
                lastName: string;
                phoneNumber: string;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.DriverStatus;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            licenseNumber: string;
            kycStatus: import(".prisma/client").$Enums.KycStatus;
            availability: import(".prisma/client").$Enums.DriverAvailability;
            vehicleId: string | null;
        })[];
        trips: ({
            driver: {
                user: {
                    firstName: string;
                    lastName: string;
                };
            } & {
                id: string;
                status: import(".prisma/client").$Enums.DriverStatus;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                licenseNumber: string;
                kycStatus: import(".prisma/client").$Enums.KycStatus;
                availability: import(".prisma/client").$Enums.DriverAvailability;
                vehicleId: string | null;
            };
            order: {
                status: import(".prisma/client").$Enums.OrderStatus;
                orderNumber: string;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.TripStatus;
            createdAt: Date;
            updatedAt: Date;
            vehicleId: string;
            startedAt: Date | null;
            completedAt: Date | null;
            eta: Date | null;
            orderId: string;
            driverId: string;
        })[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.VehicleStatus;
        createdAt: Date;
        updatedAt: Date;
        plateNumber: string;
        category: import(".prisma/client").$Enums.VehicleCategory;
        capacityKg: number;
        isPartitioned: boolean;
    }>;
    update(id: string, updateVehicleDto: UpdateVehicleDto, userId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.VehicleStatus;
        createdAt: Date;
        updatedAt: Date;
        plateNumber: string;
        category: import(".prisma/client").$Enums.VehicleCategory;
        capacityKg: number;
        isPartitioned: boolean;
    }>;
    deactivate(id: string, userId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.VehicleStatus;
        createdAt: Date;
        updatedAt: Date;
        plateNumber: string;
        category: import(".prisma/client").$Enums.VehicleCategory;
        capacityKg: number;
        isPartitioned: boolean;
    }>;
}
