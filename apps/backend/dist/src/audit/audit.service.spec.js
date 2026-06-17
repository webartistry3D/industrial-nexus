"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const audit_service_1 = require("./audit.service");
const prisma_service_1 = require("../prisma/prisma.service");
describe('AuditService', () => {
    let service;
    let prisma;
    const mockPrisma = {
        auditLog: {
            create: jest.fn(),
            findMany: jest.fn(),
            count: jest.fn(),
        },
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                audit_service_1.AuditService,
                { provide: prisma_service_1.PrismaService, useValue: mockPrisma },
            ],
        }).compile();
        service = module.get(audit_service_1.AuditService);
        prisma = module.get(prisma_service_1.PrismaService);
        jest.clearAllMocks();
    });
    describe('log', () => {
        it('should create audit log entry', async () => {
            const logData = {
                userId: 'user-1',
                action: 'LOGIN',
                entityType: 'USER',
                entityId: 'user-1',
                ipAddress: '127.0.0.1',
                userAgent: 'Mozilla/5.0',
            };
            mockPrisma.auditLog.create.mockResolvedValue({
                id: 'log-1',
                ...logData,
                createdAt: new Date(),
            });
            await service.log(logData);
            expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    userId: 'user-1',
                    action: 'LOGIN',
                    entityType: 'USER',
                    entityId: 'user-1',
                }),
            });
        });
        it('should handle audit log without optional fields', async () => {
            const logData = {
                action: 'CREATE',
                entityType: 'USER',
                newValue: { email: 'test@example.com' },
            };
            mockPrisma.auditLog.create.mockResolvedValue({
                id: 'log-1',
                ...logData,
                createdAt: new Date(),
            });
            await service.log(logData);
            expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    action: 'CREATE',
                    entityType: 'USER',
                    newValue: { email: 'test@example.com' },
                    oldValue: null,
                    userId: undefined,
                    entityId: undefined,
                    ipAddress: null,
                    userAgent: null,
                }),
            });
        });
    });
    describe('getAuditLogs', () => {
        it('should return audit logs with limit', async () => {
            const mockLogs = [
                { id: '1', action: 'LOGIN', entityType: 'USER', createdAt: new Date() },
                { id: '2', action: 'CREATE', entityType: 'ORDER', createdAt: new Date() },
            ];
            mockPrisma.auditLog.findMany.mockResolvedValue(mockLogs);
            const result = await service.getAuditLogs(undefined, undefined, 10);
            expect(result).toHaveLength(2);
            expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(expect.objectContaining({
                take: 10,
                orderBy: { createdAt: 'desc' },
            }));
        });
        it('should filter by userId when provided', async () => {
            mockPrisma.auditLog.findMany.mockResolvedValue([]);
            await service.getAuditLogs('user-1');
            expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: { userId: 'user-1' },
            }));
        });
        it('should filter by entityType when provided', async () => {
            mockPrisma.auditLog.findMany.mockResolvedValue([]);
            await service.getAuditLogs(undefined, 'USER');
            expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: { entityType: 'USER' },
            }));
        });
    });
});
//# sourceMappingURL=audit.service.spec.js.map