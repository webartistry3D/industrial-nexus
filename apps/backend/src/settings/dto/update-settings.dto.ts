import { IsString, IsNumber, IsBoolean, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class GeneralSettingsDto {
  @IsString()
  @IsOptional()
  companyName?: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsString()
  @IsOptional()
  dateFormat?: string;

  @IsString()
  @IsOptional()
  language?: string;
}

export class NotificationSettingsDto {
  @IsBoolean()
  @IsOptional()
  emailNotifications?: boolean;

  @IsBoolean()
  @IsOptional()
  smsNotifications?: boolean;

  @IsBoolean()
  @IsOptional()
  pushNotifications?: boolean;

  @IsBoolean()
  @IsOptional()
  orderAlerts?: boolean;

  @IsBoolean()
  @IsOptional()
  tripAlerts?: boolean;

  @IsBoolean()
  @IsOptional()
  driverAlerts?: boolean;
}

export class SecuritySettingsDto {
  @IsNumber()
  @IsOptional()
  passwordMinLength?: number;

  @IsNumber()
  @IsOptional()
  sessionTimeout?: number;

  @IsBoolean()
  @IsOptional()
  twoFactorAuth?: boolean;

  @IsString()
  @IsOptional()
  ipWhitelist?: string;
}

export class OperationsSettingsDto {
  @IsBoolean()
  @IsOptional()
  autoAssignDrivers?: boolean;

  @IsBoolean()
  @IsOptional()
  requireApproval?: boolean;

  @IsNumber()
  @IsOptional()
  maxActiveTrips?: number;

  @IsBoolean()
  @IsOptional()
  weightValidation?: boolean;

  @IsBoolean()
  @IsOptional()
  geofenceAlerts?: boolean;
}

export class UpdateSettingsDto {
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => GeneralSettingsDto)
  general?: GeneralSettingsDto;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationSettingsDto)
  notifications?: NotificationSettingsDto;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => SecuritySettingsDto)
  security?: SecuritySettingsDto;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => OperationsSettingsDto)
  operations?: OperationsSettingsDto;
}
