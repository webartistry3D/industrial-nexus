import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UnauthorizedException, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;

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
      updateMany: jest.fn(),
    },
    passwordResetToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
    },
    session: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-token'),
    signAsync: jest.fn().mockResolvedValue('mock-token'),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      if (key === 'JWT_SECRET') return 'test-secret';
      if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret';
      if (key === 'JWT_EXPIRATION') return '1h';
      if (key === 'JWT_REFRESH_EXPIRATION') return '7d';
      if (key === 'JWT_EXPIRES_IN') return defaultValue || '15m';
      if (key === 'JWT_REFRESH_EXPIRES_IN') return defaultValue || '7d';
      return defaultValue || null;
    }),
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);

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

      await expect(
        service.login({ email: 'test@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
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

      const result = await service.login(
        { email: 'test@example.com', password: 'Password123' },
        '127.0.0.1',
        'Mozilla/5.0',
      );

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: '1',
          action: 'LOGIN',
          entityType: 'USER',
        }),
      );
    });
  });

  describe('register', () => {
    it('should throw ConflictException when email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1', email: 'test@example.com' });

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'Password123',
          firstName: 'Test',
          lastName: 'User',
          role: 'CLIENT',
        }),
      ).rejects.toThrow(ConflictException);
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

  describe('requestPasswordReset', () => {
    it('should return message even when email does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.requestPasswordReset({ email: 'nonexistent@example.com' });

      expect(result.message).toContain('If the email exists');
    });

    it('should create password reset token when email exists', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.passwordResetToken.updateMany.mockResolvedValue({ count: 0 });
      mockPrisma.passwordResetToken.create.mockResolvedValue({ id: 'token-1' });
      mockConfigService.get.mockReturnValue('development');

      const result = await service.requestPasswordReset({ email: 'test@example.com' });

      expect(result.message).toContain('Password reset token');
      expect(mockPrisma.passwordResetToken.create).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PASSWORD_RESET_REQUEST',
        }),
      );
    });

    it('should invalidate existing reset tokens before creating new one', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.passwordResetToken.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.passwordResetToken.create.mockResolvedValue({ id: 'token-1' });
      mockConfigService.get.mockReturnValue('development');

      await service.requestPasswordReset({ email: 'test@example.com' });

      expect(mockPrisma.passwordResetToken.updateMany).toHaveBeenCalledWith({
        where: { userId: '1', usedAt: null },
        data: { usedAt: expect.any(Date) },
      });
    });
  });

  describe('resetPassword', () => {
    it('should throw NotFoundException for invalid token', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue(null);

      await expect(
        service.resetPassword({ token: 'invalid-token', newPassword: 'NewPassword123!' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for already used token', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: '1',
        usedAt: new Date(),
      });

      await expect(
        service.resetPassword({ token: 'used-token', newPassword: 'NewPassword123!' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for expired token', async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: '1',
        usedAt: null,
        expiresAt: new Date('2020-01-01'),
        user: { id: '1', email: 'test@example.com' },
      });

      await expect(
        service.resetPassword({ token: 'expired-token', newPassword: 'NewPassword123!' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reset password successfully', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue({
        id: '1',
        usedAt: null,
        expiresAt: new Date(Date.now() + 3600000),
        user: mockUser,
      });
      mockPrisma.user.update.mockResolvedValue(mockUser);
      mockPrisma.passwordResetToken.update.mockResolvedValue({ id: '1' });
      mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.resetPassword({
        token: 'valid-token',
        newPassword: 'NewPassword123!',
      });

      expect(result.message).toBe('Password has been reset successfully');
      expect(mockPrisma.user.update).toHaveBeenCalled();
      expect(mockPrisma.passwordResetToken.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { usedAt: expect.any(Date) },
      });
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PASSWORD_RESET',
        }),
      );
    });
  });

  describe('getActiveSessions', () => {
    it('should return active sessions for user', async () => {
      const mockSessions = [
        {
          id: '1',
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
          createdAt: new Date(),
          lastActivityAt: new Date(),
          expiresAt: new Date(Date.now() + 3600000),
        },
      ];
      mockPrisma.session.findMany.mockResolvedValue(mockSessions);

      const result = await service.getActiveSessions('user-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('ipAddress');
      expect(mockPrisma.session.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          isActive: true,
          expiresAt: { gt: expect.any(Date) },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('revokeSession', () => {
    it('should throw NotFoundException for non-existent session', async () => {
      mockPrisma.session.findFirst.mockResolvedValue(null);

      await expect(service.revokeSession('user-1', 'session-1')).rejects.toThrow(NotFoundException);
    });

    it('should revoke session successfully', async () => {
      mockPrisma.session.findFirst.mockResolvedValue({ id: '1', userId: 'user-1' });
      mockPrisma.session.update.mockResolvedValue({ id: '1', isActive: false });

      const result = await service.revokeSession('user-1', 'session-1');

      expect(result.message).toBe('Session revoked successfully');
      expect(mockPrisma.session.update).toHaveBeenCalledWith({
        where: { id: 'session-1' },
        data: {
          isActive: false,
          revokedAt: expect.any(Date),
        },
      });
    });
  });

  describe('revokeAllSessions', () => {
    it('should revoke all active sessions for user', async () => {
      mockPrisma.session.updateMany.mockResolvedValue({ count: 5 });

      const result = await service.revokeAllSessions('user-1');

      expect(result.message).toBe('All sessions revoked successfully');
      expect(mockPrisma.session.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          isActive: true,
        },
        data: {
          isActive: false,
          revokedAt: expect.any(Date),
        },
      });
    });
  });
});
