import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserFilterDto } from './dto/user-filter.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto, user: {
        userId: string;
    }): Promise<any>;
    findAll(filterDto: UserFilterDto): Promise<{
        data: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            phoneNumber: string;
            role: import(".prisma/client").$Enums.UserRole;
            status: import(".prisma/client").$Enums.UserStatus;
            createdAt: Date;
            lastLoginAt: Date;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getProfile(user: {
        userId: string;
    }): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phoneNumber: string;
        role: import(".prisma/client").$Enums.UserRole;
        status: import(".prisma/client").$Enums.UserStatus;
        createdAt: Date;
        updatedAt: Date;
        lastLoginAt: Date;
        driver: {
            id: string;
            status: import(".prisma/client").$Enums.DriverStatus;
            licenseNumber: string;
            kycStatus: import(".prisma/client").$Enums.KycStatus;
            availability: import(".prisma/client").$Enums.DriverAvailability;
        };
    }>;
    findOne(id: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        phoneNumber: string;
        role: import(".prisma/client").$Enums.UserRole;
        status: import(".prisma/client").$Enums.UserStatus;
        createdAt: Date;
        updatedAt: Date;
        lastLoginAt: Date;
        driver: {
            id: string;
            status: import(".prisma/client").$Enums.DriverStatus;
            licenseNumber: string;
            kycStatus: import(".prisma/client").$Enums.KycStatus;
            availability: import(".prisma/client").$Enums.DriverAvailability;
        };
    }>;
    update(id: string, updateUserDto: UpdateUserDto, user: {
        userId: string;
    }): Promise<any>;
    deactivate(id: string, user: {
        userId: string;
    }): Promise<any>;
}
