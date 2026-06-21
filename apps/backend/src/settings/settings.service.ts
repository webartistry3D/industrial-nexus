import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHandlingTagDto, UpdateHandlingTagDto } from './dto/handling-tag.dto';

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

  // Handling Tag CRUD operations
  async getAllHandlingTags() {
    const tags = await this.prisma.availableHandlingTag.findMany({
      orderBy: { name: 'asc' },
    });
    return tags;
  }

  async createHandlingTag(createTagDto: CreateHandlingTagDto) {
    const existingTag = await this.prisma.availableHandlingTag.findUnique({
      where: { name: createTagDto.name.toUpperCase() },
    });

    if (existingTag) {
      throw new ConflictException(`Tag with name "${createTagDto.name}" already exists`);
    }

    const tag = await this.prisma.availableHandlingTag.create({
      data: {
        name: createTagDto.name.toUpperCase(),
      },
    });

    return tag;
  }

  async updateHandlingTag(id: string, updateTagDto: UpdateHandlingTagDto) {
    const existingTag = await this.prisma.availableHandlingTag.findUnique({
      where: { id },
    });

    if (!existingTag) {
      throw new NotFoundException(`Tag with ID "${id}" not found`);
    }

    // Check if new name conflicts with existing tag
    if (updateTagDto.name.toUpperCase() !== existingTag.name) {
      const nameConflict = await this.prisma.availableHandlingTag.findUnique({
        where: { name: updateTagDto.name.toUpperCase() },
      });

      if (nameConflict) {
        throw new ConflictException(`Tag with name "${updateTagDto.name}" already exists`);
      }
    }

    const updatedTag = await this.prisma.availableHandlingTag.update({
      where: { id },
      data: {
        name: updateTagDto.name.toUpperCase(),
      },
    });

    return updatedTag;
  }

  async deleteHandlingTag(id: string) {
    const existingTag = await this.prisma.availableHandlingTag.findUnique({
      where: { id },
    });

    if (!existingTag) {
      throw new NotFoundException(`Tag with ID "${id}" not found`);
    }

    await this.prisma.availableHandlingTag.delete({
      where: { id },
    });

    return { message: 'Tag deleted successfully' };
  }
}
