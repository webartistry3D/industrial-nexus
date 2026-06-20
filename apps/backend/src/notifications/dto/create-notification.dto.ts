import { NotificationType } from '@prisma/client';

export class CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityId?: string;
  entityType?: string;
}
