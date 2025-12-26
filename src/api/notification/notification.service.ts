import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Telegraf } from 'telegraf';
import { Student } from 'src/core/entity/student.entity';
import { Lesson } from 'src/core/entity/lesson.entity';
import { Notification } from 'src/core/entity/notification.entity';
import { config } from 'src/config';
import { BaseService } from 'src/infrastructure/base-service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import type { NotificationRepository } from 'src/core/repository/notification.repository';
import { ISuccess } from 'src/infrastructure/pagination/successResponse';
import { successRes } from 'src/infrastructure/response/success.response';

@Injectable()
export class NotificationService
  extends BaseService<CreateNotificationDto, UpdateNotificationDto, Notification>
  implements OnModuleInit
{
  private bot: Telegraf;
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: NotificationRepository,
    @InjectRepository(Lesson)
    private readonly lessonRepo: Repository<Lesson>,
  ) {
    super(notificationRepo);
  }

  async onModuleInit() {
    try {
      if (!config.TELEGRAM_BOT_TOKEN) {
        throw new Error('TELEGRAM_BOT_TOKEN topilmadi! .env faylni tekshiring.');
      }
      this.bot = new Telegraf(config.TELEGRAM_BOT_TOKEN);
      this.logger.log('✅ Telegram bot initialized');
    } catch (error) {
      this.logger.error('❌ Telegram bot initialization error:', error.message);
    }
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleLessonReminders() {
    const now = new Date();


    const startWindow = new Date(now.getTime() + 15 * 60000);
    const endWindow = new Date(now.getTime() + 25 * 60000);

    this.logger.log('=============================================');
    this.logger.log(`⏰ Hozirgi vaqt (Server): ${now.toString()}`);
    this.logger.log(
      `🔎 Qidirilayotgan oraliq: ${startWindow.getHours()}:${startWindow.getMinutes()} dan ${endWindow.getHours()}:${endWindow.getMinutes()} gacha`,
    );

    try {
      const upcomingLessons = await this.lessonRepo.find({
        where: {
          startTime: Between(startWindow, endWindow),
        },
        relations: ['student'], // Student ma'lumotlari kerak
      });

      this.logger.log(`📊 Oraliqqa tushgan darslar soni: ${upcomingLessons.length}`);


      if (upcomingLessons.length === 0) {
        this.logger.warn(
          '⚠️ Oraliqda dars topilmadi. Bazadagi yaqin 2 soatlik darslarni tekshiramiz...',
        );

        const next2Hours = new Date(now.getTime() + 120 * 60000);
        const allUpcoming = await this.lessonRepo.find({
          where: {
            startTime: Between(now, next2Hours),
          },
          order: { startTime: 'ASC' },
          take: 3,
        });

        if (allUpcoming.length > 0) {
          this.logger.log(
            '💡 Bazada quyidagi darslar mavjud (Vaqtni solishtiring!):',
          );
          allUpcoming.forEach((l) => {
            this.logger.log(
              ` - Dars: "${l.name}" | Vaqti: ${l.startTime} | (JS Date: ${new Date(l.startTime).toString()})`,
            );
          });
        } else {
          this.logger.warn(
            '⚠️ Bazada yaqin 2 soat ichida umuman dars yoq! Yangi dars yarating.',
          );
        }
      }

      for (const lesson of upcomingLessons) {

        const student = lesson.student;

        if (!student) {
          this.logger.warn(`⚠️ Dars ID: ${lesson.id} uchun student biriktirilmagan.`);
          continue;
        }

        await this.sendTelegramReminder(student, lesson);
      }
    } catch (error) {
      this.logger.error('❌ Darslarni qidirishda xatolik:', error.message);
    }

    this.logger.log('=============================================');
  }

  private async sendTelegramReminder(student: Student, lesson: Lesson) {
    if (!student.tgId) {
      this.logger.warn(`⚠️ Student (ID: ${student.id}) da Telegram ID yo'q.`);
      return;
    }

    const dateObj = new Date(lesson.startTime);
    const timeString = dateObj.toLocaleTimeString('uz-UZ', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Tashkent',
    });

    const message =
      `🔔 *Dars eslatmasi!*\n\n` +
      `📚 *Fan:* ${lesson.name || 'Dars'}\n` +
      `⏰ *Vaqt:* ${timeString}\n` +
      `📍 *Link:* ${lesson.googleMeetUrl || 'Onlayn'}\n\n` +
      `Iltimos, darsga kechikmasdan kiring!`;

    try {
      if (!this.bot) {
        this.logger.error('❌ Bot initialized emas.');
        return;
      }

      await this.bot.telegram.sendMessage(student.tgId, message, {
        parse_mode: 'Markdown',
      });
      this.logger.log(
        `✅ Xabar yuborildi: ${student.id || 'Student'} (TG: ${student.tgId})`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Telegram xabar yuborishda xatolik (TG ID: ${student.tgId}): ${error.message}`,
      );
    }
  }

  
  async getStudentNotifications(studentId: string): Promise<ISuccess> {
    const notifications = await this.notificationRepo.find({
      where: { studentId },
      order: { createdAt: 'DESC' },
    });

    return successRes(notifications);
  }

  
  async getUnreadNotifications(studentId: string): Promise<ISuccess> {
    const notifications = await this.notificationRepo.find({
      where: { studentId, isRead: false },
      order: { createdAt: 'DESC' },
    });

    return successRes(notifications);
  }

  async sendBulkNotification(dto: SendNotificationDto): Promise<ISuccess> {
    const notifications: Notification[] = [];
    for (const studentId of dto.studentIds) {
      const notification = await this.notificationRepo.save({
        studentId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        channel: dto.channel,
        metadata: dto.metadata,
      });
      notifications.push(notification);
    }
    return successRes(notifications);
  }

  async markAsRead(notificationIds: string[]): Promise<ISuccess> {
    await this.notificationRepo.update(
      { id: In(notificationIds) },
      { isRead: true, readAt: new Date() },
    );
    const notifications = await this.notificationRepo.find({
      where: { id: In(notificationIds) },
    });
    return successRes(notifications);
  }
}
