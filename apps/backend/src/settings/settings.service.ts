import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  private defaultSettings = {
    general: {
      companyName: 'Industrial Nexus',
      timezone: 'Africa/Lagos',
      dateFormat: 'DD/MM/YYYY',
      language: 'en',
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      orderAlerts: true,
      tripAlerts: true,
      driverAlerts: true,
    },
    security: {
      passwordMinLength: 8,
      sessionTimeout: 30,
      twoFactorAuth: false,
      ipWhitelist: '',
    },
    operations: {
      autoAssignDrivers: false,
      requireApproval: true,
      maxActiveTrips: 10,
      weightValidation: true,
      geofenceAlerts: true,
    },
  };

  async getSettings() {
    // For now, return default settings. In production, these would be stored in database
    return this.defaultSettings;
  }

  async updateSettings(settings: any) {
    // For now, just return the merged settings. In production, these would be stored in database
    return { ...this.defaultSettings, ...settings };
  }
}
