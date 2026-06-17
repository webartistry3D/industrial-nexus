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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcrypt");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
let AuthService = class AuthService {
    constructor(prisma, jwtService, configService, auditService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
        this.auditService = auditService;
    }
    async validateUser(email, password) {
        const user = await this.prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });
        if (!user || user.status !== 'ACTIVE') {
            return null;
        }
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return null;
        }
        return user;
    }
    async login(loginDto, ipAddress, userAgent) {
        const user = await this.validateUser(loginDto.email, loginDto.password);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const tokens = await this.generateTokens(user.id, user.email, user.role);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        await this.auditService.log({
            userId: user.id,
            action: 'LOGIN',
            entityType: 'USER',
            entityId: user.id,
            ipAddress,
            userAgent,
        });
        return tokens;
    }
    async register(registerDto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: registerDto.email.toLowerCase() },
        });
        if (existingUser) {
            throw new common_1.ConflictException('Email already registered');
        }
        const passwordHash = await bcrypt.hash(registerDto.password, 10);
        const user = await this.prisma.user.create({
            data: {
                email: registerDto.email.toLowerCase(),
                passwordHash,
                firstName: registerDto.firstName,
                lastName: registerDto.lastName,
                phoneNumber: registerDto.phoneNumber,
                role: registerDto.role || 'CLIENT',
            },
        });
        await this.auditService.log({
            userId: user.id,
            action: 'CREATE',
            entityType: 'USER',
            entityId: user.id,
            newValue: { email: user.email, role: user.role },
        });
        return this.generateTokens(user.id, user.email, user.role);
    }
    async refreshTokens(refreshToken) {
        const tokenRecord = await this.prisma.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: true },
        });
        if (!tokenRecord || tokenRecord.revokedAt || tokenRecord.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        await this.prisma.refreshToken.update({
            where: { id: tokenRecord.id },
            data: { revokedAt: new Date() },
        });
        return this.generateTokens(tokenRecord.user.id, tokenRecord.user.email, tokenRecord.user.role);
    }
    async logout(userId, refreshToken, ipAddress, userAgent) {
        await this.prisma.refreshToken.updateMany({
            where: {
                token: refreshToken,
                userId,
            },
            data: { revokedAt: new Date() },
        });
        await this.auditService.log({
            userId,
            action: 'LOGOUT',
            entityType: 'USER',
            entityId: userId,
            ipAddress,
            userAgent,
        });
    }
    async generateTokens(userId, email, role) {
        const payload = { sub: userId, email, role };
        const accessToken = this.jwtService.sign(payload);
        const refreshTokenString = this.generateRandomToken();
        const refreshExpiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d');
        const refreshExpiresDays = parseInt(refreshExpiresIn.replace('d', ''));
        await this.prisma.refreshToken.create({
            data: {
                token: refreshTokenString,
                userId,
                expiresAt: new Date(Date.now() + refreshExpiresDays * 24 * 60 * 60 * 1000),
            },
        });
        return {
            accessToken,
            refreshToken: refreshTokenString,
            expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
            tokenType: 'Bearer',
        };
    }
    generateRandomToken() {
        return `${Date.now()}-${Math.random().toString(36).substring(2)}-${Math.random().toString(36).substring(2)}`;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        audit_service_1.AuditService])
], AuthService);
//# sourceMappingURL=auth.service.js.map