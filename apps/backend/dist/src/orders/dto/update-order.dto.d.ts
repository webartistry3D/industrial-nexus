import { Priority, HandlingTagType } from '@prisma/client';
declare class LocationDto {
    lat: number;
    lng: number;
    address: string;
}
export declare class UpdateOrderDto {
    totalWeight?: number;
    priority?: Priority;
    pickupLocation?: LocationDto;
    deliveryLocation?: LocationDto;
    cargoDescription?: string;
    deliveryInstructions?: string;
    handlingTags?: HandlingTagType[];
}
export {};
