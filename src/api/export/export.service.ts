import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Teacher } from 'src/core/entity/teacher.entity';
import { Student } from 'src/core/entity/student.entity';
import { Lesson } from 'src/core/entity/lesson.entity';
import { Transaction } from 'src/core/entity/transaction.entity';
import { LessonHistory } from 'src/core/entity/lessonHistory.entity';
import { successRes } from 'src/infrastructure/response/success.response';

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(Teacher)
    private readonly teacherRepo: Repository<Teacher>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(Lesson)
    private readonly lessonRepo: Repository<Lesson>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(LessonHistory)
    private readonly lessonHistoryRepo: Repository<LessonHistory>,
  ) {}

  async exportTeachers(): Promise<any> {
    const teachers = await this.teacherRepo.find({
      select: [
        'id',
        'email',
        'phoneNumber',
        'fullName',
        'specification',
        'level',
        'hourPrice',
        'rating',
        'isActive',
        'createdAt',
      ],
      order: { createdAt: 'DESC' },
    });

    return successRes({
      data: teachers,
      format: 'json',
      count: teachers.length,
    });
  }

  async exportStudents(): Promise<any> {
    const students = await this.studentRepo.find({
      select: [
        'id',
        'firstName',
        'lastName',
        'phoneNumber',
        'tgUsername',
        'isBlocked',
        'createdAt',
      ],
      order: { createdAt: 'DESC' },
    });

    return successRes({
      data: students,
      format: 'json',
      count: students.length,
    });
  }

  async exportLessons(): Promise<any> {
    const lessons = await this.lessonRepo.find({
      relations: ['teacher', 'student'],
      order: { createdAt: 'DESC' },
    });

    return successRes({
      data: lessons,
      format: 'json',
      count: lessons.length,
    });
  }

  async exportTransactions(): Promise<any> {
    const transactions = await this.transactionRepo.find({
      relations: ['studentRelation'],
      order: { createdAt: 'DESC' },
    });

    return successRes({
      data: transactions,
      format: 'json',
      count: transactions.length,
    });
  }

  async exportLessonHistory(): Promise<any> {
    const history = await this.lessonHistoryRepo.find({
      relations: ['teacher', 'student'],
      order: { createdAt: 'DESC' },
    });

    return successRes({
      data: history,
      format: 'json',
      count: history.length,
    });
  }
}

