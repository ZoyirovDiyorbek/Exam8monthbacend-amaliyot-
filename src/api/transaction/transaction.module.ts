import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { Transaction } from 'src/core/entity/transaction.entity';
import { Lesson } from 'src/core/entity/lesson.entity';
import { Student } from 'src/core/entity/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, Lesson, Student])],
  controllers: [TransactionController],
  providers: [TransactionService],
  exports: [TransactionService],
})
export class TransactionModule {}
