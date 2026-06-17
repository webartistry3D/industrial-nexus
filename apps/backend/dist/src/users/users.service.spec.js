"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const users_service_1 = require("./users.service");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const common_1 = require("@nestjs/common");
describe('UsersService', () => {
    let service;
    let prisma;
    const mockPrisma = {
        user: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
        },
    };
    const mockAuditService = {
        log: jest.fn(),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                users_service_1.UsersService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrisma },
                { provide: audit_service_1.AuditService, useValue: mockAuditService },
            ],
        }).compile();
        service = module.get(users_service_1.UsersService);
        prisma = module.get(prisma_service_1.PrismaService);
        jest.clearAllMocks();
    });
    describe('create', () => {
        it('should throw ConflictException when email already exists', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({ id: '1', email: 'test@example.com' });
            await expect(service.create({
                email: 'test@example.com',
                password: 'Password123',
                firstName: 'Test',
                lastName: 'User',
                role: 'CLIENT',
            }, 'admin-id')).rejects.toThrow(common_1.ConflictException);
        });
        it('should create user and log audit when successful', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);
            mockPrisma.user.create.mockResolvedValue({
                id: '1',
                email: 'new@example.com',
                firstName: 'New',
                lastName: 'User',
                role: 'CLIENT',
                status: 'ACTIVE',
                createdAt: new Date(),
            });
            const result = await service.create({
                email: 'new@example.com',
                password: 'Password123',
                firstName: 'New',
                lastName: 'User',
                role: 'CLIENT',
            }, 'admin-id');
            expect(result).not.toHaveProperty('passwordHash');
            expect(result.email).toBe('new@example.com');
            expect(mockAuditService.log).toHaveBeenCalledWith(expect.objectContaining({
                action: 'CREATE',
                entityType: 'USER',
            }));
        });
        it('should hash password before storing', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);
            mockPrisma.user.create.mockImplementation((args) => ({
                id: '1',
                ...args.data,
                createdAt: new Date(),
            }));
            await service.create({
                email: 'test@example.com',
                password: 'Password123',
                firstName: 'Test',
                lastName: 'User',
                role: 'CLIENT',
            }, 'admin-id');
            const createCall = mockPrisma.user.create.mock.calls[0][0];
            expect(createCall.data.passwordHash).not.toBe('Password123');
            expect(createCall.data.passwordHash).toMatch(/^\$2[aby]\$/);
        });
    });
    describe('findAll', () => {
        it('should return paginated users with filters', async () => {
            const mockUsers = [
                { id: '1', email: 'user1@example.com', role: 'CLIENT', status: 'ACTIVE' },
                { id: '2', email: 'user2@example.com', role: 'OPERATIONS', status: 'ACTIVE' },
            ];
            mockPrisma.user.findMany.mockResolvedValue(mockUsers);
            mockPrisma.user.count.mockResolvedValue(2);
            const result = await service.findAll({ page: 1, limit: 10, role: 'CLIENT' });
            expect(result.data).toHaveLength(2);
            expect(result.meta.total).toBe(2);
            expect(result.meta.page).toBe(1);
        });
        it('should apply search filter when provided', async () => {
            mockPrisma.user.findMany.mockResolvedValue([]);
            mockPrisma.user.count.mockResolvedValue(0);
            await service.findAll({ page: 1, limit: 10, search: 'john' });
            expect(mockPrisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.objectContaining({
                    OR: expect.arrayContaining([
                        expect.objectContaining({ email: expect.any(Object) }),
                    ]),
                }),
            }));
        });
    });
    describe('update', () => {
        it('should throw NotFoundException when user not found', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);
            await expect(service.update('non-existent-id', { firstName: 'New' }, 'admin-id')).rejects.toThrow(common_1.NotFoundException);
        });
        it('should log audit when role changes', async () => {
            const mockUser = {
                id: '1',
                email: 'test@example.com',
                role: 'CLIENT',
                status: 'ACTIVE',
            };
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);
            mockPrisma.user.update.mockResolvedValue({ ...mockUser, role: 'OPERATIONS' });
            await service.update('1', { role: 'OPERATIONS' }, 'admin-id');
            expect(mockAuditService.log).toHaveBeenCalledWith(expect.objectContaining({
                action: 'ROLE_CHANGE',
                entityType: 'USER',
                oldValue: { role: 'CLIENT' },
                newValue: { role: 'OPERATIONS' },
            }));
        });
    });
    describe('deactivate', () => {
        it('should set user status to INACTIVE', async () => {
            const mockUser = {
                id: '1',
                email: 'test@example.com',
                status: 'ACTIVE',
            };
            mockPrisma.user.findUnique.mockResolvedValue(mockUser);
            mockPrisma.user.update.mockResolvedValue({ ...mockUser, status: 'INACTIVE' });
            await service.deactivate('1', 'admin-id');
            expect(mockPrisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
                data: { status: 'INACTIVE' },
            }));
        });
    });
});
//# sourceMappingURL=users.service.spec.js.map