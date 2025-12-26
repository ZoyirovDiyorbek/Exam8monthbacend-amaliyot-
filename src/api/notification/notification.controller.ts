import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { MarkReadDto } from './dto/mark-read.dto';
import { AuthGuard } from 'src/common/guard/auth.guard';
import { RolesGuard } from 'src/common/guard/role.guard';
import { AccessRoles } from 'src/common/decorator/roles.decorator';
import { Roles } from 'src/common/enum/index.enum';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import type { IToken } from 'src/infrastructure/token/interface';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @AccessRoles(Roles.ADMIN, Roles.SUPER_ADMIN)
  @ApiOperation({ summary: 'Yangi notification yaratish' })
  @ApiResponse({ status: 201, description: 'Notification muvaffaqiyatli yaratildi' })
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationService.create(createNotificationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Barcha notification\'larni olish' })
  @ApiResponse({ status: 200, description: 'Notification\'lar ro\'yxati' })
  findAll(@Query() query: any) {
    return this.notificationService.findAll(query);
  }

  @Get('my')
  @ApiOperation({ summary: 'Foydalanuvchining o\'z notification\'larini olish' })
  @ApiResponse({ status: 200, description: 'Foydalanuvchi notification\'lari' })
  getMyNotifications(@CurrentUser() user: IToken) {
    return this.notificationService.getStudentNotifications(user.id);
  }

  @Get('my/unread')
  @ApiOperation({ summary: 'O\'qilmagan notification\'larni olish' })
  @ApiResponse({ status: 200, description: 'O\'qilmagan notification\'lar' })
  getUnreadNotifications(@CurrentUser() user: IToken) {
    return this.notificationService.getUnreadNotifications(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Notification\'ni ID bo\'yicha olish' })
  @ApiResponse({ status: 200, description: 'Notification ma\'lumotlari' })
  @ApiResponse({ status: 404, description: 'Notification topilmadi' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationService.findOneById(id);
  }

  @Patch(':id')
  @AccessRoles(Roles.ADMIN, Roles.SUPER_ADMIN)
  @ApiOperation({ summary: 'Notification\'ni yangilash' })
  @ApiResponse({ status: 200, description: 'Notification muvaffaqiyatli yangilandi' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ) {
    return this.notificationService.update(id, updateNotificationDto);
  }

  @Patch(':id/mark-read')
  @ApiOperation({ summary: 'Notification\'ni o\'qilgan deb belgilash' })
  @ApiResponse({ status: 200, description: 'Notification o\'qilgan deb belgilandi' })
  markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() markReadDto: MarkReadDto,
    @CurrentUser() user: IToken,
  ) {
    return this.notificationService.markAsRead(markReadDto.notificationIds);
  }

  @Post('send')
  @AccessRoles(Roles.ADMIN, Roles.SUPER_ADMIN)
  @ApiOperation({ summary: 'Notification yuborish' })
  @ApiResponse({ status: 200, description: 'Notification muvaffaqiyatli yuborildi' })
  sendNotification(@Body() sendNotificationDto: SendNotificationDto) {
    return this.notificationService.sendBulkNotification(sendNotificationDto);
  }

  @Delete(':id')
  @AccessRoles(Roles.ADMIN, Roles.SUPER_ADMIN)
  @ApiOperation({ summary: 'Notification\'ni o\'chirish' })
  @ApiResponse({ status: 200, description: 'Notification muvaffaqiyatli o\'chirildi' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationService.delete(id);
  }
}
