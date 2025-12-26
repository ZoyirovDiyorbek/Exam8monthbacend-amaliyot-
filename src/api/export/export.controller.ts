import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ExportService } from './export.service';
import { AuthGuard } from 'src/common/guard/auth.guard';
import { RolesGuard } from 'src/common/guard/role.guard';
import { AccessRoles } from 'src/common/decorator/roles.decorator';
import { Roles } from 'src/common/enum/index.enum';

@ApiTags('Export')
@ApiBearerAuth()
@Controller('export')
@UseGuards(AuthGuard, RolesGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('teachers')
  @AccessRoles(Roles.SUPER_ADMIN, Roles.ADMIN)
  @ApiOperation({ summary: 'Teachers ma\'lumotlarini export qilish' })
  exportTeachers() {
    return this.exportService.exportTeachers();
  }

  @Get('students')
  @AccessRoles(Roles.SUPER_ADMIN, Roles.ADMIN)
  @ApiOperation({ summary: 'Students ma\'lumotlarini export qilish' })
  exportStudents() {
    return this.exportService.exportStudents();
  }

  @Get('lessons')
  @AccessRoles(Roles.SUPER_ADMIN, Roles.ADMIN)
  @ApiOperation({ summary: 'Lessons ma\'lumotlarini export qilish' })
  exportLessons() {
    return this.exportService.exportLessons();
  }

  @Get('transactions')
  @AccessRoles(Roles.SUPER_ADMIN, Roles.ADMIN)
  @ApiOperation({ summary: 'Transactions ma\'lumotlarini export qilish' })
  exportTransactions() {
    return this.exportService.exportTransactions();
  }

  @Get('lesson-history')
  @AccessRoles(Roles.SUPER_ADMIN, Roles.ADMIN)
  @ApiOperation({ summary: 'Lesson History ma\'lumotlarini export qilish' })
  exportLessonHistory() {
    return this.exportService.exportLessonHistory();
  }
}

