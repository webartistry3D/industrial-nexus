import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { DriverFilterDto } from './dto/driver-filter.dto';
export declare class DriversController {
    private readonly driversService;
    constructor(driversService: DriversService);
    create(createDriverDto: CreateDriverDto, user: {
        userId: string;
    }): Promise<{
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            phoneNumber: string;
        };
        vehicle: {
            id: string;
            status: import(".prisma/client").$Enums.VehicleStatus;
            createdAt: Date;
            updatedAt: Date;
            plateNumber: string;
            category: import(".prisma/client").$Enums.VehicleCategory;
            capacityKg: number;
            isPartitioned: boolean;
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
    }>;
    findAll(filterDto: DriverFilterDto): Promise<{
        data: ({
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                phoneNumber: string;
            };
            vehicle: {
                id: string;
                status: import(".prisma/client").$Enums.VehicleStatus;
                createdAt: Date;
                updatedAt: Date;
                plateNumber: string;
                category: import(".prisma/client").$Enums.VehicleCategory;
                capacityKg: number;
                isPartitioned: boolean;
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
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findAvailable(): Promise<{
        data: ({
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
                phoneNumber: string;
            };
            vehicle: {
                id: string;
                status: import(".prisma/client").$Enums.VehicleStatus;
                createdAt: Date;
                updatedAt: Date;
                plateNumber: string;
                category: import(".prisma/client").$Enums.VehicleCategory;
                capacityKg: number;
                isPartitioned: boolean;
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
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            phoneNumber: string;
        };
        trips: ({
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
        vehicle: {
            id: string;
            status: import(".prisma/client").$Enums.VehicleStatus;
            createdAt: Date;
            updatedAt: Date;
            plateNumber: string;
            category: import(".prisma/client").$Enums.VehicleCategory;
            capacityKg: number;
            isPartitioned: boolean;
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
    }>;
    update(id: string, updateDriverDto: UpdateDriverDto, user: {
        userId: string;
    }): Promise<{
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            phoneNumber: string;
        };
        vehicle: {
            id: string;
            status: import(".prisma/client").$Enums.VehicleStatus;
            createdAt: Date;
            updatedAt: Date;
            plateNumber: string;
            category: import(".prisma/client").$Enums.VehicleCategory;
            capacityKg: number;
            isPartitioned: boolean;
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
    }>;
    verifyKyc(id: string, user: {
        userId: string;
    }): Promise<{
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            phoneNumber: string;
        };
        vehicle: {
            id: string;
            status: import(".prisma/client").$Enums.VehicleStatus;
            createdAt: Date;
            updatedAt: Date;
            plateNumber: string;
            category: import(".prisma/client").$Enums.VehicleCategory;
            capacityKg: number;
            isPartitioned: boolean;
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
    }>;
    deactivate(id: string, user: {
        userId: string;
    }): Promise<{
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            phoneNumber: string;
        };
        vehicle: {
            id: string;
            status: import(".prisma/client").$Enums.VehicleStatus;
            createdAt: Date;
            updatedAt: Date;
            plateNumber: string;
            category: import(".prisma/client").$Enums.VehicleCategory;
            capacityKg: number;
            isPartitioned: boolean;
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
    }>;
}
