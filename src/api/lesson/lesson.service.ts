import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { BaseService } from 'src/infrastructure/base-service';
import { Lesson } from 'src/core/entity/lesson.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { GoogleCalendarService } from './google-calendar.service';
import { Teacher } from 'src/core/entity/teacher.entity';
import { Student } from 'src/core/entity/student.entity';
import { LessonStatus, Rating } from 'src/common/enum/index.enum';
import type { LessonRepository } from 'src/core/repository/lesson.repository';
import type { TeacherRepository } from 'src/core/repository/teacher.repository';
import type { StudentRepository } from 'src/core/repository/student.repository';
import { LessonComplete } from './dto/lesson-complete.dto';
import { successRes } from 'src/infrastructure/response/success.response';
import { LessonHistory } from 'src/core/entity/lessonHistory.entity';
import type { LessonHistoryRepository } from 'src/core/repository/lessonHistory.repository';

@Injectable()
export class LessonService extends BaseService<
  CreateLessonDto,
  UpdateLessonDto,
  Lesson
> {
  constructor(
    @InjectRepository(Lesson) private readonly lessonRepo: LessonRepository,
    @InjectRepository(Teacher)
    private readonly teacherRepo: TeacherRepository,
    @InjectRepository(Student)
    private readonly studentRepo: StudentRepository,
    private readonly calendarService: GoogleCalendarService,

    @InjectRepository(LessonHistory)
    private readonly lessonHistoryRepo: LessonHistoryRepository,
  ) {
    super(lessonRepo);
  }

  
  async createLesson(dto: CreateLessonDto, teacherId: string): Promise<Lesson> {

    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    if (startTime >= endTime) {
      throw new BadRequestException('End time must be after start time');
    }

    if (startTime < new Date()) {
      throw new BadRequestException('Start time cannot be in the past');
    }

    const teacher = await this.teacherRepo.findOne({
      where: { id: teacherId },
    });
    if (!teacher) {
      throw new NotFoundException(`Teacher with ID ${teacherId} not found`);
    }

    if (!teacher.googleAccessToken || !teacher.googleRefreshToken) {
      throw new BadRequestException(
        'Teacher has not connected Google Calendar',
      );
    }

    const conflictingLesson = await this.lessonRepo.findOne({
      where: {
        teacherId: teacherId,
        startTime: startTime,
      },
    });

    if (conflictingLesson) {
      throw new BadRequestException('You already have a lesson at this time');
    }

    try {

      const calendar = this.calendarService.getClient(teacher);

      const event = await calendar.events.insert({
        calendarId: 'primary',
        conferenceDataVersion: 1,
        requestBody: {
          summary: `Lesson: ${dto.name}`,
          description: 'Available lesson slot for students to book',
          start: {
            dateTime: startTime.toISOString(),
            timeZone: 'Asia/Tashkent',
          },
          end: {
            dateTime: endTime.toISOString(),
            timeZone: 'Asia/Tashkent',
          },
          conferenceData: {
            createRequest: {
              requestId: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              conferenceSolutionKey: { type: 'hangoutsMeet' },
            },
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 24 * 60 }, // 1 day before
              { method: 'popup', minutes: 30 }, // 30 minutes before
            ],
          },
        },
      });

      const lesson = this.lessonRepo.create({
        name: dto.name,
        startTime,
        endTime,
        price: dto.price,
        status: dto.status ?? LessonStatus.AVAILABLE,
        isPaid: dto.isPaid ?? false,
        teacherId: teacherId,
        googleMeetUrl: event.data.hangoutLink ?? undefined,
        googleEventId: event.data.id ?? undefined,
      });

      lesson.teacher = teacher;

      return await this.lessonRepo.save(lesson);
    } catch (error) {

      if (error.code === 401) {
        throw new BadRequestException(
          'Google Calendar authorization expired. Please reconnect.',
        );
      }
      if (error.code === 403) {
        throw new BadRequestException(
          'Insufficient permissions for Google Calendar',
        );
      }
      throw new BadRequestException(
        `Failed to create lesson: ${error.message}`,
      );
    }
  }


  async lessonComplete(
    teacherId: string,
    dto: LessonComplete,
    lessonId: string,
  ) {

    const lesson = await this.lessonRepo.findOne({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    if (lesson.teacherId !== teacherId) {
      throw new ForbiddenException('You can only complete your own lessons');
    }

    if (lesson.status === LessonStatus.COMPLETED) {
      throw new BadRequestException('Lesson is already completed');
    }


    return await this.lessonRepo.manager.transaction(async (manager) => {

      const lessonHistory = await manager.save(LessonHistory, {
        lessonId: lessonId,
        star: dto.star || Rating.FIVE,
        feedback: dto.feedback || 'feedback mavjud emas',
        teacherId: lesson.teacherId,
        studentId: lesson.studentId,
      });

      await manager.delete(Lesson, lessonId);

      return successRes({
        message: 'Lesson completed and moved to history',
        lessonHistory,
      });
    });
  }
  
  async bookLesson(lessonId: string, studentId: string): Promise<Lesson> {

    const lesson = await this.lessonRepo.findOne({
      where: { id: lessonId },
      relations: ['teacher'],
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    if (lesson.status !== LessonStatus.AVAILABLE) {
      throw new BadRequestException('Lesson is not available for booking');
    }

    if (lesson.studentId) {
      throw new BadRequestException('Lesson is already booked');
    }

    const student = await this.studentRepo.findOne({
      where: { id: studentId },
    });
    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    const conflictingLesson = await this.lessonRepo.findOne({
      where: {
        studentId: studentId,
        startTime: lesson.startTime,
      },
    });

    if (conflictingLesson) {
      throw new BadRequestException('You already have a lesson at this time');
    }

    try {

      if (lesson.googleEventId && lesson.teacher) {
        const calendar = this.calendarService.getClient(lesson.teacher);

        await calendar.events.patch({
          calendarId: 'primary',
          eventId: lesson.googleEventId,
          requestBody: {
            description: `Lesson booked by: ${student.firstName || ''} ${student.lastName || ''}`,
          },
        });
      }

      lesson.studentId = studentId;
      lesson.student = student;
      lesson.status = LessonStatus.BOOKED;
      lesson.bookedAt = new Date();

      return await this.lessonRepo.save(lesson);
    } catch (error) {
      throw new BadRequestException(`Failed to book lesson: ${error.message}`);
    }
  }

  
  async updateLesson(id: string, dto: UpdateLessonDto): Promise<Lesson> {
    const lesson = await this.lessonRepo.findOne({
      where: { id },
      relations: ['teacher', 'student'],
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${id} not found`);
    }

    if (dto.startTime || dto.endTime) {
      const startTime = dto.startTime
        ? new Date(dto.startTime)
        : lesson.startTime;
      const endTime = dto.endTime ? new Date(dto.endTime) : lesson.endTime;

      if (startTime >= endTime) {
        throw new BadRequestException('End time must be after start time');
      }

      if (lesson.googleEventId && lesson.teacher) {
        try {
          const calendar = this.calendarService.getClient(lesson.teacher);

          await calendar.events.patch({
            calendarId: 'primary',
            eventId: lesson.googleEventId,
            requestBody: {
              start: {
                dateTime: startTime.toISOString(),
                timeZone: 'Asia/Tashkent',
              },
              end: {
                dateTime: endTime.toISOString(),
                timeZone: 'Asia/Tashkent',
              },
            },
          });
        } catch (error) {
          throw new BadRequestException(
            `Failed to update Google Calendar event: ${error.message}`,
          );
        }
      }

      lesson.startTime = startTime;
      lesson.endTime = endTime;
    }

    if (dto.name) lesson.name = dto.name;
    if (dto.status) lesson.status = dto.status;
    if (dto.price !== undefined) lesson.price = dto.price;
    if (dto.isPaid !== undefined) lesson.isPaid = dto.isPaid;

    return await this.lessonRepo.save(lesson);
  }

  
  async deleteLesson(id: string): Promise<void> {
    const lesson = await this.lessonRepo.findOne({
      where: { id },
      relations: ['teacher'],
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${id} not found`);
    }

    if (lesson.googleEventId && lesson.teacher) {
      try {
        const calendar = this.calendarService.getClient(lesson.teacher);
        await calendar.events.delete({
          calendarId: 'primary',
          eventId: lesson.googleEventId,
        });
      } catch (error) {
        console.error('Failed to delete Google Calendar event:', error.message);

      }
    }

    await this.lessonRepo.remove(lesson);
  }

  
  async getAvailableLessons(): Promise<Lesson[]> {
    return await this.lessonRepo.find({
      where: {
        status: LessonStatus.AVAILABLE,
      },
      relations: ['teacher'],
      order: { startTime: 'ASC' },
    });
  }

  
  async getMyLessons(studentId: string): Promise<Lesson[]> {
    return await this.lessonRepo.find({
      where: { studentId },
      relations: ['teacher'],
      order: { startTime: 'ASC' },
    });
  }

  
  async getTeacherLessons(teacherId: string): Promise<Lesson[]> {
    return await this.lessonRepo.find({
      where: { teacherId },
      relations: ['student'],
      order: { startTime: 'ASC' },
    });
  }
}
