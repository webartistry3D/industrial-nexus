import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserFilterDto } from './dto/user-filter.dto';
export declare class UsersService {
    private prisma;
    private auditService;
    constructor(prisma: PrismaService, auditService: AuditService);
    create(createUserDto: CreateUserDto, currentUserId: string): Promise<any>;
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
    update(id: string, updateUserDto: UpdateUserDto, currentUserId: string): Promise<any>;
    deactivate(id: string, currentUserId: string): Promise<any>;
    private sanitizeUser;
}
