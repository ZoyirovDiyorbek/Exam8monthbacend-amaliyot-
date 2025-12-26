import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';
import { Teacher } from 'src/core/entity/teacher.entity';
import { Student } from 'src/core/entity/student.entity';
import { Lesson } from 'src/core/entity/lesson.entity';
import { Transaction } from 'src/core/entity/transaction.entity';
import { LessonHistory } from 'src/core/entity/lessonHistory.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Teacher,
      Student,
      Lesson,
      Transaction,
      LessonHistory,
    ]),
  ],
  controllers: [StatisticsController],
  providers: [StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {}

