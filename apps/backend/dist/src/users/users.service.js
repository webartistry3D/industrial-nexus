"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = require("bcrypt");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
let UsersService = class UsersService {
    constructor(prisma, auditService) {
        this.prisma = prisma;
        this.auditService = auditService;
    }
    async create(createUserDto, currentUserId) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: createUserDto.email.toLowerCase() },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Email already registered');
        }
        const passwordHash = await bcrypt.hash(createUserDto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                email: createUserDto.email.toLowerCase(),
                passwordHash,
                firstName: createUserDto.firstName,
                lastName: createUserDto.lastName,
                phoneNumber: createUserDto.phoneNumber,
                role: createUserDto.role,
                status: createUserDto.status || 'ACTIVE',
            },
        });
        await this.auditService.log({
            userId: currentUserId,
            action: 'CREATE',
            entityType: 'USER',
            entityId: user.id,
            newValue: { email: user.email, role: user.role, status: user.status },
        });
        return this.sanitizeUser(user);
    }
    async findAll(filterDto) {
        const { page = 1, limit = 10, role, status, search } = filterDto;
        const skip = (page - 1) * limit;
        const where = {};
        if (role)
            where.role = role;
        if (status)
            where.status = status;
        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    phoneNumber: true,
                    role: true,
                    status: true,
                    createdAt: true,
                    lastLoginAt: true,
                },
            }),
            this.prisma.user.count({ where }),
        ]);
        return {
            data: users,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phoneNumber: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                lastLoginAt: true,
                driver: {
                    select: {
                        id: true,
                        licenseNumber: true,
                        kycStatus: true,
                        status: true,
                        availability: true,
                    },
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async update(id, updateUserDto, currentUserId) {
        const existingUser = await this.prisma.user.findUnique({ where: { id } });
        if (!existingUser) {
            throw new common_1.NotFoundException('User not found');
        }
        const oldValue = { ...existingUser };
        delete oldValue.passwordHash;
        const updateData = {};
        if (updateUserDto.firstName !== undefined)
            updateData.firstName = updateUserDto.firstName;
        if (updateUserDto.lastName !== undefined)
            updateData.lastName = updateUserDto.lastName;
        if (updateUserDto.phoneNumber !== undefined)
            updateData.phoneNumber = updateUserDto.phoneNumber;
        if (updateUserDto.status !== undefined)
            updateData.status = updateUserDto.status;
        if (updateUserDto.role !== undefined && updateUserDto.role !== existingUser.role) {
            updateData.role = updateUserDto.role;
            await this.auditService.log({
                userId: currentUserId,
                action: 'ROLE_CHANGE',
                entityType: 'USER',
                entityId: id,
                oldValue: { role: existingUser.role },
                newValue: { role: updateUserDto.role },
            });
        }
        if (updateUserDto.status !== undefined && updateUserDto.status !== existingUser.status) {
            await this.auditService.log({
                userId: currentUserId,
                action: 'STATUS_CHANGE',
                entityType: 'USER',
                entityId: id,
                oldValue: { status: existingUser.status },
                newValue: { status: updateUserDto.status },
            });
        }
        const user = await this.prisma.user.update({
            where: { id },
            data: updateData,
        });
        if (Object.keys(updateData).length > 0 && !updateData.role && !updateData.status) {
            await this.auditService.log({
                userId: currentUserId,
                action: 'UPDATE',
                entityType: 'USER',
                entityId: id,
                oldValue,
                newValue: this.sanitizeUser(user),
            });
        }
        return this.sanitizeUser(user);
    }
    async deactivate(id, currentUserId) {
        return this.update(id, { status: 'INACTIVE' }, currentUserId);
    }
    sanitizeUser(user) {
        const { passwordHash, ...sanitized } = user;
        return sanitized;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], UsersService);
//# sourceMappingURL=users.service.js.map