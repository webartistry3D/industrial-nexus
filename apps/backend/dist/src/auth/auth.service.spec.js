"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const auth_service_1 = require("./auth.service");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const common_1 = require("@nestjs/common");
const bcrypt = require("bcrypt");
describe('AuthService', () => {
    let service;
    let prisma;
    const mockPrisma = {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        refreshToken: {
            create: jest.fn(),
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    };
    const mockJwtService = {
        sign: jest.fn().mockReturnValue('mock-token'),
        signAsync: jest.fn().mockResolvedValue('mock-token'),
    };
    const mockConfigService = {
        get: jest.fn((key, defaultValue) => {
            if (key === 'JWT_SECRET')
                return 'test-secret';
            if (key === 'JWT_REFRESH_SECRET')
                return 'refresh-secret';
            if (key === 'JWT_EXPIRATION')
                return '1h';
            if (key === 'JWT_REFRESH_EXPIRATION')
                return '7d';
            if (key === 'JWT_EXPIRES_IN')
                return defaultValue || '15m';
            if (key === 'JWT_REFRESH_EXPIRES_IN')
                return defaultValue || '7d';
            return defaultValue || null;
        }),
    };
    const mockAuditService = {
        log: jest.fn(),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                auth_service_1.AuthService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrisma },
                { provide: jwt_1.JwtService, useValue: mockJwtService },
                { provide: config_1.ConfigService, useValue: mockConfigService },
                { provide: audit_service_1.AuditService, useValue: mockAuditService },
            ],
        }).compile();
        service = module.get(auth_service_1.AuthService);
        prisma = module.get(prisma_service_1.PrismaService);
        jest.clearAllMocks();
    });
    describe('validateUser', () => {
        it('should return user when credentials are valid', async () => {
            const mockUser = {
                id: '1',
                email: 'test@example.com',
                passwordHash: await bcrypt.hash('Password123', 10),
                status: 'ACTIVE',
                role: 'CLIENT',
            };
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);
            const result = await service.validateUser('test@example.com', 'Password123');
            expect(result).toBeDefined();
            expect(result.email).toBe('test@example.com');
        });
        it('should return null when user not found', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);
            const result = await service.validateUser('test@example.com', 'Password123');
            expect(result).toBeNull();
        });
        it('should return null when password is incorrect', async () => {
            const mockUser = {
                id: '1',
                email: 'test@example.com',
                passwordHash: await bcrypt.hash('CorrectPassword', 10),
                status: 'ACTIVE',
                role: 'CLIENT',
            };
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);
            const result = await service.validateUser('test@example.com', 'WrongPassword');
            expect(result).toBeNull();
        });
        it('should return null when user is not ACTIVE', async () => {
            const mockUser = {
                id: '1',
                email: 'test@example.com',
                passwordHash: await bcrypt.hash('Password123', 10),
                status: 'INACTIVE',
                role: 'CLIENT',
            };
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);
            const result = await service.validateUser('test@example.com', 'Password123');
            expect(result).toBeNull();
        });
    });
    describe('login', () => {
        it('should throw UnauthorizedException when credentials are invalid', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);
            await expect(service.login({ email: 'test@example.com', password: 'wrong' })).rejects.toThrow(common_1.UnauthorizedException);
        });
        it('should return tokens and log audit when login succeeds', async () => {
            const mockUser = {
                id: '1',
                email: 'test@example.com',
                passwordHash: await bcrypt.hash('Password123', 10),
                status: 'ACTIVE',
                role: 'CLIENT',
            };
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);
            mockPrisma.user.update.mockResolvedValue({ ...mockUser, lastLoginAt: new Date() });
            const result = await service.login({ email: 'test@example.com', password: 'Password123' }, '127.0.0.1', 'Mozilla/5.0');
            expect(result).toHaveProperty('accessToken');
            expect(result).toHaveProperty('refreshToken');
            expect(mockAuditService.log).toHaveBeenCalledWith(expect.objectContaining({
                userId: '1',
                action: 'LOGIN',
                entityType: 'USER',
            }));
        });
    });
    describe('register', () => {
        it('should throw ConflictException when email already exists', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({ id: '1', email: 'test@example.com' });
            await expect(service.register({
                email: 'test@example.com',
                password: 'Password123',
                firstName: 'Test',
                lastName: 'User',
                role: 'CLIENT',
            })).rejects.toThrow(common_1.ConflictException);
        });
        it('should create user and log audit when registration succeeds', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);
            mockPrisma.user.create.mockResolvedValue({
                id: '1',
                email: 'new@example.com',
                role: 'CLIENT',
                status: 'ACTIVE',
            });
            const result = await service.register({
                email: 'new@example.com',
                password: 'Password123',
                firstName: 'New',
                lastName: 'User',
                role: 'CLIENT',
            });
            expect(result).toHaveProperty('accessToken');
            expect(result).toHaveProperty('refreshToken');
            expect(mockAuditService.log).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=auth.service.spec.js.map