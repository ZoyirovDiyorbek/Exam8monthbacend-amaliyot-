import {
  Controller,
  Get,
  UseGuards,
  Query,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';
import { AuthGuard } from 'src/common/guard/auth.guard';
import { RolesGuard } from 'src/common/guard/role.guard';
import { AccessRoles } from 'src/common/decorator/roles.decorator';
import { Roles } from 'src/common/enum/index.enum';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import type { IToken } from 'src/infrastructure/token/interface';

@ApiTags('Statistics')
@ApiBearerAuth()
@Controller('statistics')
@UseGuards(AuthGuard, RolesGuard)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('dashboard')
  @AccessRoles(Roles.SUPER_ADMIN, Roles.ADMIN)
  @ApiOperation({ summary: 'Dashboard statistikalari' })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  getDashboardStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.statisticsService.getDashboardStats(start, end);
  }

  @Get('teacher/:teacherId')
  @AccessRoles(Roles.SUPER_ADMIN, Roles.ADMIN, Roles.TEACHER)
  @ApiOperation({ summary: 'Teacher statistikalari' })
  getTeacherStats(@Param('teacherId', ParseUUIDPipe) teacherId: string) {
    return this.statisticsService.getTeacherStats(teacherId);
  }

  @Get('teacher/me')
  @AccessRoles(Roles.TEACHER)
  @ApiOperation({ summary: "O'z teacher statistikalari" })
  getMyTeacherStats(@CurrentUser() user: IToken) {
    return this.statisticsService.getTeacherStats(user.id);
  }

  @Get('student/:studentId')
  @AccessRoles(Roles.SUPER_ADMIN, Roles.ADMIN, Roles.TEACHER)
  @ApiOperation({ summary: 'Student statistikalari' })
  getStudentStats(@Param('studentId', ParseUUIDPipe) studentId: string) {
    return this.statisticsService.getStudentStats(studentId);
  }

  @Get('student/me')
  @AccessRoles(Roles.STUDENT)
  @ApiOperation({ summary: "O'z student statistikalari" })
  getMyStudentStats(@CurrentUser() user: IToken) {
    return this.statisticsService.getStudentStats(user.id);
  }
}

