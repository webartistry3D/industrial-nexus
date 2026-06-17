import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { TokenResponseDto } from './dto/token-response.dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    private configService;
    private auditService;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService, auditService: AuditService);
    validateUser(email: string, password: string): Promise<{
        id: string;
        email: string;
        passwordHash: string;
        firstName: string;
        lastName: string;
        phoneNumber: string | null;
        role: import(".prisma/client").$Enums.UserRole;
        status: import(".prisma/client").$Enums.UserStatus;
        createdAt: Date;
        updatedAt: Date;
        lastLoginAt: Date | null;
    }>;
    login(loginDto: LoginDto, ipAddress?: string, userAgent?: string): Promise<TokenResponseDto>;
    register(registerDto: RegisterDto): Promise<TokenResponseDto>;
    refreshTokens(refreshToken: string): Promise<TokenResponseDto>;
    logout(userId: string, refreshToken: string, ipAddress?: string, userAgent?: string): Promise<void>;
    private generateTokens;
    private generateRandomToken;
}
