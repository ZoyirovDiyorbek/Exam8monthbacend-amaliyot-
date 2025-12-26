import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Teacher } from 'src/core/entity/teacher.entity';
import { Student } from 'src/core/entity/student.entity';
import { Lesson } from 'src/core/entity/lesson.entity';
import { Transaction } from 'src/core/entity/transaction.entity';
import { LessonHistory } from 'src/core/entity/lessonHistory.entity';
import { Repository, Between } from 'typeorm';
import { LessonStatus, TransactionStatus } from 'src/common/enum/index.enum';
import { successRes } from 'src/infrastructure/response/success.response';

@Injectable()
export class StatisticsService {
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

  async getDashboardStats(startDate?: Date, endDate?: Date) {
    const whereCondition: any = {};
    if (startDate && endDate) {
      whereCondition.createdAt = Between(startDate, endDate);
    }

    const [
      totalTeachers,
      activeTeachers,
      totalStudents,
      activeStudents,
      totalLessons,
      completedLessons,
      totalTransactions,
      paidTransactions,
      totalRevenue,
    ] = await Promise.all([
      this.teacherRepo.count({ where: whereCondition }),
      this.teacherRepo.count({
        where: { ...whereCondition, isActive: true },
      }),
      this.studentRepo.count({ where: whereCondition }),
      this.studentRepo.count({
        where: { ...whereCondition, isBlocked: false },
      }),
      this.lessonRepo.count({ where: whereCondition }),
      this.lessonHistoryRepo.count({ where: whereCondition }),
      this.transactionRepo.count({ where: whereCondition }),
      this.transactionRepo.count({
        where: { ...whereCondition, status: TransactionStatus.PAID },
      }),
      this.transactionRepo
        .createQueryBuilder('transaction')
        .select('SUM(transaction.amount)', 'total')
        .where('transaction.status = :status', {
          status: TransactionStatus.PAID,
        })
        .andWhere(whereCondition.createdAt ? 'transaction.createdAt BETWEEN :start AND :end' : '1=1', {
          start: startDate,
          end: endDate,
        })
        .getRawOne(),
    ]);

    const recentLessons = await this.lessonRepo.find({
      where: whereCondition,
      take: 10,
      order: { createdAt: 'DESC' },
      relations: ['teacher', 'student'],
    });

    const recentTransactions = await this.transactionRepo.find({
      where: whereCondition,
      take: 10,
      order: { createdAt: 'DESC' },
      relations: ['studentRelation'],
    });

    return successRes({
      overview: {
        teachers: {
          total: totalTeachers,
          active: activeTeachers,
          inactive: totalTeachers - activeTeachers,
        },
        students: {
          total: totalStudents,
          active: activeStudents,
          blocked: totalStudents - activeStudents,
        },
        lessons: {
          total: totalLessons,
          completed: completedLessons,
          pending: totalLessons - completedLessons,
        },
        transactions: {
          total: totalTransactions,
          paid: paidTransactions,
          pending: totalTransactions - paidTransactions,
        },
        revenue: {
          total: parseFloat(totalRevenue?.total || '0'),
        },
      },
      recentLessons,
      recentTransactions,
    });
  }

  async getTeacherStats(teacherId: string) {
    const [totalLessons, completedLessons, totalEarnings, upcomingLessons] =
      await Promise.all([
        this.lessonRepo.count({ where: { teacherId } }),
        this.lessonHistoryRepo.count({ where: { teacherId } }),
        this.transactionRepo
          .createQueryBuilder('transaction')
          .leftJoin('transaction.lessonRelation', 'lesson')
          .select('SUM(transaction.amount)', 'total')
          .where('lesson.teacherId = :teacherId', { teacherId })
          .andWhere('transaction.status = :status', {
            status: TransactionStatus.PAID,
          })
          .getRawOne(),
        this.lessonRepo.count({
          where: {
            teacherId,
            status: LessonStatus.BOOKED,
          },
        }),
      ]);

    return successRes({
      totalLessons,
      completedLessons,
      upcomingLessons,
      totalEarnings: parseFloat(totalEarnings?.total || '0'),
    });
  }

  async getStudentStats(studentId: string) {
    const [totalLessons, completedLessons, totalSpent, upcomingLessons] =
      await Promise.all([
        this.lessonRepo.count({ where: { studentId } }),
        this.lessonHistoryRepo.count({ where: { studentId } }),
        this.transactionRepo
          .createQueryBuilder('transaction')
          .select('SUM(transaction.amount)', 'total')
          .where('transaction.student = :studentId', { studentId })
          .andWhere('transaction.status = :status', {
            status: TransactionStatus.PAID,
          })
          .getRawOne(),
        this.lessonRepo.count({
          where: {
            studentId,
            status: LessonStatus.BOOKED,
          },
        }),
      ]);

    return successRes({
      totalLessons,
      completedLessons,
      upcomingLessons,
      totalSpent: parseFloat(totalSpent?.total || '0'),
    });
  }
}

