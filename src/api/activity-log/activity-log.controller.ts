import {
  Controller,
  Get,
  UseGuards,
  Query,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ActivityLogService } from './activity-log.service';
import { AuthGuard } from 'src/common/guard/auth.guard';
import { RolesGuard } from 'src/common/guard/role.guard';
import { AccessRoles } from 'src/common/decorator/roles.decorator';
import { Roles } from 'src/common/enum/index.enum';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import type { IToken } from 'src/infrastructure/token/interface';

@ApiTags('Activity Logs')
@ApiBearerAuth()
@Controller('activity-logs')
@UseGuards(AuthGuard, RolesGuard)
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Get('me')
  @AccessRoles(Roles.TEACHER, Roles.STUDENT, Roles.ADMIN)
  @ApiOperation({ summary: "O'z faolliklarini olish" })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  getMyActivities(
    @CurrentUser() user: IToken,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.activityLogService.getUserActivities(user.id, start, end);
  }

  @Get('user/:userId')
  @AccessRoles(Roles.SUPER_ADMIN, Roles.ADMIN)
  @ApiOperation({ summary: 'Foydalanuvchi faolliklarini olish' })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  getUserActivities(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.activityLogService.getUserActivities(userId, start, end);
  }

  @Get('entity/:entityType/:entityId')
  @AccessRoles(Roles.SUPER_ADMIN, Roles.ADMIN)
  @ApiOperation({ summary: 'Entity faolliklarini olish' })
  getEntityActivities(
    @Param('entityType') entityType: string,
    @Param('entityId', ParseUUIDPipe) entityId: string,
  ) {
    return this.activityLogService.getEntityActivities(entityType, entityId);
  }
}

