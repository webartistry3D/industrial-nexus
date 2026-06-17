import { Priority, HandlingTagType } from '@prisma/client';
export declare class LocationDto {
    lat: number;
    lng: number;
    address: string;
    [key: string]: any;
}
export declare class CreateOrderDto {
    clientId?: string;
    totalWeight: number;
    priority?: Priority;
    pickupLocation: LocationDto;
    deliveryLocation: LocationDto;
    cargoDescription?: string;
    deliveryInstructions?: string;
    handlingTags?: HandlingTagType[];
}
