import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserFilterDto } from './dto/user-filter.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(createUserDto: CreateUserDto, currentUserId: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
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

  async findAll(filterDto: UserFilterDto) {
    const { page = 1, limit = 10, role, status, search } = filterDto;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (role) where.role = role;
    if (status) where.status = status;
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

  async findOne(id: string) {
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
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto, currentUserId: string) {
    const existingUser = await this.prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const oldValue = { ...existingUser };
    delete (oldValue as any).passwordHash;

    const updateData: any = {};
    
    if (updateUserDto.firstName !== undefined) updateData.firstName = updateUserDto.firstName;
    if (updateUserDto.lastName !== undefined) updateData.lastName = updateUserDto.lastName;
    if (updateUserDto.phoneNumber !== undefined) updateData.phoneNumber = updateUserDto.phoneNumber;
    if (updateUserDto.status !== undefined) updateData.status = updateUserDto.status;
    
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

  async deactivate(id: string, currentUserId: string) {
    return this.update(id, { status: 'INACTIVE' }, currentUserId);
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }
}
