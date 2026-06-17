import { UserRole, UserStatus } from '@prisma/client';
export declare class UserFilterDto {
    page?: number;
    limit?: number;
    role?: UserRole;
    status?: UserStatus;
    search?: string;
}
