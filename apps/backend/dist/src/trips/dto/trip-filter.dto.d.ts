import { TripStatus } from '@prisma/client';
export declare class TripFilterDto {
    page?: number;
    limit?: number;
    status?: TripStatus;
    driverId?: string;
    orderId?: string;
}
