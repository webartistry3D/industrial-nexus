import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { WeightWatchService } from '../weight-watch/weight-watch.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { TripFilterDto } from './dto/trip-filter.dto';
import { AssignDriverDto } from './dto/assign-driver.dto';
export declare class TripsService {
    private prisma;
    private auditService;
    private weightWatchService;
    constructor(prisma: PrismaService, auditService: AuditService, weightWatchService: WeightWatchService);
    create(createTripDto: CreateTripDto, userId: string): Promise<{
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
        order: {
            handlingTags: {
                id: string;
                orderId: string;
                tag: import(".prisma/client").$Enums.HandlingTagType;
            }[];
        } & {
            id: string;
            status: import(".prisma/client").$Enums.OrderStatus;
            createdAt: Date;
            updatedAt: Date;
            orderNumber: string;
            totalWeight: number;
            priority: import(".prisma/client").$Enums.Priority;
            pickupLocation: import("@prisma/client/runtime/library").JsonValue;
            deliveryLocation: import("@prisma/client/runtime/library").JsonValue;
            cargoDescription: string | null;
            deliveryInstructions: string | null;
            kittingStatus: import(".prisma/client").$Enums.KittingStatus;
            submittedAt: Date | null;
            approvedAt: Date | null;
            cancelledAt: Date | null;
            clientId: string;
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
    }>;
    findAll(filterDto: TripFilterDto): Promise<{
        data: ({
            driver: {
                user: {
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
            order: {
                id: string;
                status: import(".prisma/client").$Enums.OrderStatus;
                orderNumber: string;
                totalWeight: number;
                priority: import(".prisma/client").$Enums.Priority;
                pickupLocation: import("@prisma/client/runtime/library").JsonValue;
                deliveryLocation: import("@prisma/client/runtime/library").JsonValue;
            };
            trackingPoints: {
                id: string;
                lat: number;
                lng: number;
                tripId: string;
                timestamp: Date;
                accuracy: number | null;
                speed: number | null;
                heading: number | null;
                receivedAt: Date;
            }[];
            weightRecords: {
                id: string;
                status: import(".prisma/client").$Enums.WeightStatus;
                orderId: string | null;
                cargoWeight: number;
                vehicleCapacity: number | null;
                utilization: number;
                checkedAt: Date;
                tripId: string | null;
            }[];
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
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        driver: {
            user: {
                id: string;
                email: string;
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
        order: {
            handlingTags: {
                id: string;
                orderId: string;
                tag: import(".prisma/client").$Enums.HandlingTagType;
            }[];
        } & {
            id: string;
            status: import(".prisma/client").$Enums.OrderStatus;
            createdAt: Date;
            updatedAt: Date;
            orderNumber: string;
            totalWeight: number;
            priority: import(".prisma/client").$Enums.Priority;
            pickupLocation: import("@prisma/client/runtime/library").JsonValue;
            deliveryLocation: import("@prisma/client/runtime/library").JsonValue;
            cargoDescription: string | null;
            deliveryInstructions: string | null;
            kittingStatus: import(".prisma/client").$Enums.KittingStatus;
            submittedAt: Date | null;
            approvedAt: Date | null;
            cancelledAt: Date | null;
            clientId: string;
        };
        trackingPoints: {
            id: string;
            lat: number;
            lng: number;
            tripId: string;
            timestamp: Date;
            accuracy: number | null;
            speed: number | null;
            heading: number | null;
            receivedAt: Date;
        }[];
        weightRecords: {
            id: string;
            status: import(".prisma/client").$Enums.WeightStatus;
            orderId: string | null;
            cargoWeight: number;
            vehicleCapacity: number | null;
            utilization: number;
            checkedAt: Date;
            tripId: string | null;
        }[];
        pod: {
            id: string;
            createdAt: Date;
            lat: number | null;
            lng: number | null;
            tripId: string;
            imageUrl: string;
            signatureUrl: string | null;
            receiverName: string | null;
            receiverPhone: string | null;
            notes: string | null;
            capturedAt: Date;
        };
        geofenceEvents: ({
            geofence: {
                id: string;
                createdAt: Date;
                name: string;
                type: import(".prisma/client").$Enums.GeofenceType;
                centerLat: number | null;
                centerLng: number | null;
                radiusA: number | null;
                radiusB: number | null;
                radiusC: number | null;
                radiusD: number | null;
                polygon: import("@prisma/client/runtime/library").JsonValue | null;
                isActive: boolean;
            };
        } & {
            id: string;
            createdAt: Date;
            lat: number;
            lng: number;
            tripId: string;
            triggeredAt: Date;
            geofenceId: string;
            eventType: import(".prisma/client").$Enums.GeofenceEventType;
        })[];
        assignments: {
            id: string;
            vehicleId: string;
            driverId: string;
            tripId: string;
            reason: string | null;
            assignedAt: Date;
            assignedBy: string;
            unassignedAt: Date | null;
        }[];
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
    }>;
    startTrip(id: string, userId: string): Promise<{
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
    }>;
    completeTrip(id: string, userId: string): Promise<{
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
    }>;
    updateDriverAssignment(id: string, assignDriverDto: AssignDriverDto, userId: string): Promise<{
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
    }>;
}
