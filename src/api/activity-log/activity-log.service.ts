import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ActivityLog } from 'src/core/entity/activityLog.entity';
import type { ActivityLogRepository } from 'src/core/repository/activityLog.repository';
import { BaseService } from 'src/infrastructure/base-service';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';
import { UpdateActivityLogDto } from './dto/update-activity-log.dto';
import { Repository, Between } from 'typeorm';
import { successRes } from 'src/infrastructure/response/success.response';

@Injectable()
export class ActivityLogService extends BaseService<
  CreateActivityLogDto,
  UpdateActivityLogDto,
  ActivityLog
> {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly activityLogRepo: ActivityLogRepository,
  ) {
    super(activityLogRepo);
  }

  async logActivity(
    userId: string,
    userRole: string,
    action: string,
    entityType: string,
    entityId?: string,
    description?: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    await this.activityLogRepo.save({
      userId,
      userRole: userRole as any,
      action,
      entityType,
      entityId,
      description,
      metadata,
      ipAddress,
      userAgent,
    });
  }

  async getUserActivities(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<any> {
    const where: any = { userId };
    if (startDate && endDate) {
      where.createdAt = Between(startDate, endDate);
    }

    const activities = await this.activityLogRepo.find({
      where,
      order: { createdAt: 'DESC' },
      take: 100,
    });

    return successRes(activities);
  }

  async getEntityActivities(
    entityType: string,
    entityId: string,
  ): Promise<any> {
    const activities = await this.activityLogRepo.find({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
      take: 50,
    });

    return successRes(activities);
  }
}

