import { IsString, IsOptional, IsEnum, IsPhoneNumber } from 'class-validator';
import { UserRole, UserStatus } from '@prisma/client';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsPhoneNumber(undefined, { message: 'Please provide a valid phone number' })
  phoneNumber?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Invalid role specified' })
  role?: UserRole;

  @IsOptional()
  @IsEnum(UserStatus, { message: 'Invalid status specified' })
  status?: UserStatus;
}

export class UpdateMyProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsPhoneNumber(undefined, { message: 'Please provide a valid phone number' })
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  profileImageUrl?: string;

  @IsOptional()
  @IsString()
  profileImageKey?: string;
}
