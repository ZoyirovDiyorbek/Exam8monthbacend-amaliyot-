import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { CancelTransactionDto } from './dto/cancel-transaction.dto';
import { BaseService } from 'src/infrastructure/base-service';
import { Transaction } from 'src/core/entity/transaction.entity';
import type { TransactionRepository } from 'src/core/repository/transaction.repository';
import { TransactionStatus } from 'src/common/enum/index.enum';
import { ISuccess } from 'src/infrastructure/pagination/successResponse';
import { successRes } from 'src/infrastructure/response/success.response';
import { Lesson } from 'src/core/entity/lesson.entity';
import type { LessonRepository } from 'src/core/repository/lesson.repository';
import { Student } from 'src/core/entity/student.entity';
import type { StudentRepository } from 'src/core/repository/student.repository';

@Injectable()
export class TransactionService extends BaseService<
  CreateTransactionDto,
  UpdateTransactionDto,
  Transaction
> {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: TransactionRepository,
    @InjectRepository(Lesson)
    private readonly lessonRepo: LessonRepository,
    @InjectRepository(Student)
    private readonly studentRepo: StudentRepository,
  ) {
    super(transactionRepo);
  }

  
  async createTransactionForLesson(
    lessonId: string,
    studentId: string,
  ): Promise<ISuccess> {
    const lesson = await this.lessonRepo.findOne({
      where: { id: lessonId },
      relations: ['student'],
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    if (lesson.studentId !== studentId) {
      throw new BadRequestException('Lesson is not booked by this student');
    }

    const existingTransaction = await this.transactionRepo.findOne({
      where: { lesson: lessonId, student: studentId },
    });

    if (existingTransaction) {
      throw new BadRequestException('Transaction already exists for this lesson');
    }

    const transaction = this.transactionRepo.create({
      lesson: lessonId,
      student: studentId,
      price: lesson.price,
      status: TransactionStatus.PENDING,
    });

    const savedTransaction = await this.transactionRepo.save(transaction);

    lesson.transaction = savedTransaction.id;
    await this.lessonRepo.save(lesson);

    return successRes(savedTransaction, 201);
  }

  
  async completeTransaction(id: string): Promise<ISuccess> {
    const transaction = await this.transactionRepo.findOne({
      where: { id },
      relations: ['studentRelation'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.status === TransactionStatus.PAID) {
      throw new BadRequestException('Transaction is already paid');
    }

    if (
      transaction.status === TransactionStatus.PENDING_CANCELED ||
      transaction.status === TransactionStatus.PAID_CANCELED
    ) {
      throw new BadRequestException('Cannot complete a canceled transaction');
    }

    transaction.status = TransactionStatus.PAID;
    transaction.performedTime = new Date();

    const updatedTransaction = await this.transactionRepo.save(transaction);

    const lesson = await this.lessonRepo.findOne({
      where: { id: transaction.lesson },
    });

    if (lesson) {
      lesson.isPaid = true;
      await this.lessonRepo.save(lesson);
    }

    return successRes(updatedTransaction);
  }

  
  async cancelTransaction(
    id: string,
    dto: CancelTransactionDto,
  ): Promise<ISuccess> {
    const transaction = await this.transactionRepo.findOne({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (
      transaction.status === TransactionStatus.PENDING_CANCELED ||
      transaction.status === TransactionStatus.PAID_CANCELED
    ) {
      throw new BadRequestException('Transaction is already canceled');
    }

    if (transaction.status === TransactionStatus.PAID) {
      transaction.status = TransactionStatus.PAID_CANCELED;
    } else {
      transaction.status = TransactionStatus.PENDING_CANCELED;
    }
    transaction.canceledTime = new Date();
    transaction.reason = dto.reason;

    const updatedTransaction = await this.transactionRepo.save(transaction);

    return successRes(updatedTransaction);
  }

  
  async getStudentTransactions(studentId: string): Promise<ISuccess> {
    const transactions = await this.transactionRepo.find({
      where: { student: studentId },
      relations: ['studentRelation'],
      order: { createdAt: 'DESC' },
    });

    return successRes(transactions);
  }

  
  async getLessonTransaction(lessonId: string): Promise<ISuccess> {
    const transaction = await this.transactionRepo.findOne({
      where: { lesson: lessonId },
      relations: ['studentRelation'],
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found for this lesson');
    }

    return successRes(transaction);
  }

  
  async getTransactionsByStatus(
    status: TransactionStatus,
  ): Promise<ISuccess> {
    const transactions = await this.transactionRepo.find({
      where: { status },
      relations: ['studentRelation'],
      order: { createdAt: 'DESC' },
    });

    return successRes(transactions);
  }
}
