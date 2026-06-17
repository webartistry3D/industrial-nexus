import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderFilterDto } from './dto/order-filter.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { UserRole } from '@prisma/client';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    create(createOrderDto: CreateOrderDto, user: {
        userId: string;
        role: UserRole;
    }): Promise<{
        kittingLogs: ({
            operator: {
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            orderId: string;
            barcodeVerified: boolean;
            notes: string | null;
            stage: import(".prisma/client").$Enums.KittingStage;
            operatorId: string;
        })[];
        client: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            phoneNumber: string;
        };
        handlingTags: {
            id: string;
            orderId: string;
            tag: import(".prisma/client").$Enums.HandlingTagType;
        }[];
        trip: {
            driver: {
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
        };
        weightRecord: {
            id: string;
            status: import(".prisma/client").$Enums.WeightStatus;
            orderId: string | null;
            cargoWeight: number;
            vehicleCapacity: number | null;
            utilization: number;
            checkedAt: Date;
            tripId: string | null;
        };
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
    }>;
    findAll(filterDto: OrderFilterDto, user: {
        userId: string;
        role: UserRole;
    }): Promise<{
        data: ({
            client: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
            handlingTags: {
                id: string;
                orderId: string;
                tag: import(".prisma/client").$Enums.HandlingTagType;
            }[];
            trip: {
                id: string;
                status: import(".prisma/client").$Enums.TripStatus;
                driver: {
                    id: string;
                    user: {
                        firstName: string;
                        lastName: string;
                    };
                };
                vehicle: {
                    id: string;
                    plateNumber: string;
                };
            };
            weightRecord: {
                id: string;
                status: import(".prisma/client").$Enums.WeightStatus;
                orderId: string | null;
                cargoWeight: number;
                vehicleCapacity: number | null;
                utilization: number;
                checkedAt: Date;
                tripId: string | null;
            };
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
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: string, user: {
        userId: string;
        role: UserRole;
    }): Promise<{
        kittingLogs: ({
            operator: {
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            orderId: string;
            barcodeVerified: boolean;
            notes: string | null;
            stage: import(".prisma/client").$Enums.KittingStage;
            operatorId: string;
        })[];
        client: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            phoneNumber: string;
        };
        handlingTags: {
            id: string;
            orderId: string;
            tag: import(".prisma/client").$Enums.HandlingTagType;
        }[];
        trip: {
            driver: {
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
        };
        weightRecord: {
            id: string;
            status: import(".prisma/client").$Enums.WeightStatus;
            orderId: string | null;
            cargoWeight: number;
            vehicleCapacity: number | null;
            utilization: number;
            checkedAt: Date;
            tripId: string | null;
        };
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
    }>;
    update(id: string, updateOrderDto: UpdateOrderDto, user: {
        userId: string;
        role: UserRole;
    }): Promise<{
        kittingLogs: ({
            operator: {
                id: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            orderId: string;
            barcodeVerified: boolean;
            notes: string | null;
            stage: import(".prisma/client").$Enums.KittingStage;
            operatorId: string;
        })[];
        client: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            phoneNumber: string;
        };
        handlingTags: {
            id: string;
            orderId: string;
            tag: import(".prisma/client").$Enums.HandlingTagType;
        }[];
        trip: {
            driver: {
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
        };
        weightRecord: {
            id: string;
            status: import(".prisma/client").$Enums.WeightStatus;
            orderId: string | null;
            cargoWeight: number;
            vehicleCapacity: number | null;
            utilization: number;
            checkedAt: Date;
            tripId: string | null;
        };
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
    }>;
    changeStatus(id: string, changeStatusDto: ChangeStatusDto, user: {
        userId: string;
        role: UserRole;
    }): Promise<{
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
    }>;
    cancel(id: string, reason: string, user: {
        userId: string;
        role: UserRole;
    }): Promise<{
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
    }>;
    submit(id: string, user: {
        userId: string;
        role: UserRole;
    }): Promise<{
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
    }>;
    approve(id: string, user: {
        userId: string;
        role: UserRole;
    }): Promise<{
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
    }>;
}
