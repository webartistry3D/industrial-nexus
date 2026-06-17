import { OrderStatus, Priority } from '@prisma/client';
export declare class OrderFilterDto {
    page?: number;
    limit?: number;
    status?: OrderStatus;
    priority?: Priority;
    clientId?: string;
    search?: string;
}
