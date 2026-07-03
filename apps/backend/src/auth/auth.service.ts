import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private auditService: AuditService,
    private mailService: MailService,
  ) {}

  async validateUser(email: string, password: string) {
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

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string): Promise<TokenResponseDto & { user: any }> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Create session record
    const sessionExpiresIn = 1; // 1 hour
    await this.prisma.session.create({
      data: {
        userId: user.id,
        token: tokens.accessToken,
        ipAddress,
        userAgent,
        expiresAt: new Date(Date.now() + sessionExpiresIn * 60 * 60 * 1000),
      },
    });

    await this.auditService.log({
      userId: user.id,
      action: 'LOGIN',
      entityType: 'USER',
      entityId: user.id,
      ipAddress,
      userAgent,
    });

    return {
      ...tokens,
      user: {
        userId: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        status: user.status,
      },
    };
  }

  async register(registerDto: RegisterDto): Promise<TokenResponseDto> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
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

  async refreshTokens(refreshToken: string): Promise<TokenResponseDto> {
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.revokedAt || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: new Date() },
    });

    return this.generateTokens(tokenRecord.user.id, tokenRecord.user.email, tokenRecord.user.role);
  }

  async logout(userId: string, refreshToken: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { 
        token: refreshToken,
        userId,
      },
      data: { revokedAt: new Date() },
    });

    // Invalidate all active sessions for this user
    await this.prisma.session.updateMany({
      where: { 
        userId,
        isActive: true,
      },
      data: { 
        isActive: false,
        revokedAt: new Date(),
      },
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

  async requestPasswordReset(requestPasswordResetDto: RequestPasswordResetDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: requestPasswordResetDto.email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if email exists for security
      return { message: 'If the email exists, a password reset link will be sent' };
    }

    // Invalidate any existing reset tokens
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    // Generate new reset token
    const resetToken = this.generateRandomToken();
    const resetExpiresIn = 1; // 1 hour

    await this.prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + resetExpiresIn * 60 * 60 * 1000),
      },
    });

    await this.auditService.log({
      userId: user.id,
      action: 'PASSWORD_RESET_REQUEST',
      entityType: 'USER',
      entityId: user.id,
      newValue: { email: user.email },
    });

    const smtpHost = this.configService.get<string>('SMTP_HOST');
    if (smtpHost) {
      try {
        await this.mailService.sendPasswordReset(user.email, user.firstName, resetToken);
      } catch {
        // Email send failure is non-fatal; token is still valid
      }
    } else if (this.configService.get<string>('NODE_ENV') === 'development') {
      return { message: `Password reset token (dev mode): ${resetToken}` };
    }

    return { message: 'If the email exists, a password reset link will be sent' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const tokenRecord = await this.prisma.passwordResetToken.findUnique({
      where: { token: resetPasswordDto.token },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new NotFoundException('Invalid or expired reset token');
    }

    if (tokenRecord.usedAt) {
      throw new BadRequestException('Reset token has already been used');
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(resetPasswordDto.newPassword, 10);

    // Update user password
    await this.prisma.user.update({
      where: { id: tokenRecord.user.id },
      data: { passwordHash },
    });

    // Mark token as used
    await this.prisma.passwordResetToken.update({
      where: { id: tokenRecord.id },
      data: { usedAt: new Date() },
    });

    // Invalidate all refresh tokens for security
    await this.prisma.refreshToken.updateMany({
      where: { userId: tokenRecord.user.id },
      data: { revokedAt: new Date() },
    });

    await this.auditService.log({
      userId: tokenRecord.user.id,
      action: 'PASSWORD_RESET',
      entityType: 'USER',
      entityId: tokenRecord.user.id,
      newValue: { email: tokenRecord.user.email },
    });

    return { message: 'Password has been reset successfully' };
  }

  async getActiveSessions(userId: string) {
    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map(session => ({
      id: session.id,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      createdAt: session.createdAt,
      lastActivityAt: session.lastActivityAt,
      expiresAt: session.expiresAt,
    }));
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.session.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    await this.prisma.session.update({
      where: { id: sessionId },
      data: {
        isActive: false,
        revokedAt: new Date(),
      },
    });

    return { message: 'Session revoked successfully' };
  }

  async revokeAllSessions(userId: string) {
    await this.prisma.session.updateMany({
      where: {
        userId,
        isActive: true,
      },
      data: {
        isActive: false,
        revokedAt: new Date(),
      },
    });

    return { message: 'All sessions revoked successfully' };
  }

  private async generateTokens(userId: string, email: string, role: string): Promise<TokenResponseDto> {
    const payload = { sub: userId, email, role };
    
    const accessToken = this.jwtService.sign(payload);
    
    const refreshTokenString = this.generateRandomToken();
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
    const refreshExpiresDays = this.parseDurationToDays(refreshExpiresIn);
    
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
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '1h'),
      tokenType: 'Bearer',
    };
  }

  private generateRandomToken(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2)}-${Math.random().toString(36).substring(2)}`;
  }

  private parseDurationToDays(duration: string): number {
    const match = duration.match(/^(\d+(\.\d+)?)(d|h|m|w)$/i);
    if (!match) return 7; // default 7 days
    const value = parseFloat(match[1]);
    switch (match[3].toLowerCase()) {
      case 'w': return value * 7;
      case 'd': return value;
      case 'h': return value / 24;
      case 'm': return value / (24 * 60);
      default:  return 7;
    }
  }
}
