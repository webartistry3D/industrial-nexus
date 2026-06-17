import { OrderStatus } from '@prisma/client';
export declare class ChangeStatusDto {
    status: OrderStatus;
    notes?: string;
}
