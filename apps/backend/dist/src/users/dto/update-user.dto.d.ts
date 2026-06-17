import { UserRole, UserStatus } from '@prisma/client';
export declare class UpdateUserDto {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    role?: UserRole;
    status?: UserStatus;
}
