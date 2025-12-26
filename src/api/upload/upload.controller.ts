import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Param,
  ParseUUIDPipe,
  Delete,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { AuthGuard } from 'src/common/guard/auth.guard';
import { RolesGuard } from 'src/common/guard/role.guard';
import { AccessRoles } from 'src/common/decorator/roles.decorator';
import { Roles } from 'src/common/enum/index.enum';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import type { IToken } from 'src/infrastructure/token/interface';

@ApiTags('Upload')
@ApiBearerAuth()
@Controller('upload')
@UseGuards(AuthGuard, RolesGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('teacher/:teacherId/image')
  @AccessRoles(Roles.SUPER_ADMIN, Roles.ADMIN, Roles.TEACHER)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Teacher rasm yuklash' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  uploadTeacherImage(
    @Param('teacherId', ParseUUIDPipe) teacherId: string,
    @UploadedFile() file: any,
    @CurrentUser() user: IToken,
  ) {

    if (user.role === Roles.TEACHER && user.id !== teacherId) {
      throw new Error('Siz faqat o\'z rasmingizni yuklay olasiz');
    }
    return this.uploadService.uploadTeacherImage(teacherId, file);
  }

  @Post('student/:studentId/image')
  @AccessRoles(Roles.SUPER_ADMIN, Roles.ADMIN, Roles.STUDENT)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Student rasm yuklash' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  uploadStudentImage(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @UploadedFile() file: any,
    @CurrentUser() user: IToken,
  ) {

    if (user.role === Roles.STUDENT && user.id !== studentId) {
      throw new Error('Siz faqat o\'z rasmingizni yuklay olasiz');
    }
    return this.uploadService.uploadStudentImage(studentId, file);
  }

  @Delete('image')
  @AccessRoles(Roles.SUPER_ADMIN, Roles.ADMIN)
  @ApiOperation({ summary: 'Rasmni o\'chirish' })
  deleteImage(@Body('imageUrl') imageUrl: string) {
    return this.uploadService.deleteImage(imageUrl);
  }
}

