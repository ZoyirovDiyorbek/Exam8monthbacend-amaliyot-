import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { CancelTransactionDto } from './dto/cancel-transaction.dto';
import { AuthGuard } from 'src/common/guard/auth.guard';
import { RolesGuard } from 'src/common/guard/role.guard';
import { AccessRoles } from 'src/common/decorator/roles.decorator';
import { Roles } from 'src/common/enum/index.enum';
import { CurrentUser } from 'src/common/decorator/current-user.decorator';
import type { IToken } from 'src/infrastructure/token/interface';

@ApiTags('Transactions')
@ApiBearerAuth()
@Controller('transactions')
@UseGuards(AuthGuard, RolesGuard)
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  @AccessRoles(Roles.ADMIN, Roles.SUPER_ADMIN)
  @ApiOperation({ summary: 'Yangi transaction yaratish' })
  @ApiResponse({ status: 201, description: 'Transaction muvaffaqiyatli yaratildi' })
  create(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionService.create(createTransactionDto);
  }

  @Post('lesson/:lessonId')
  @AccessRoles(Roles.STUDENT)
  @ApiOperation({ summary: 'Lesson uchun transaction yaratish' })
  @ApiResponse({ status: 201, description: 'Transaction muvaffaqiyatli yaratildi' })
  createForLesson(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @CurrentUser() user: IToken,
  ) {
    return this.transactionService.createTransactionForLesson(lessonId, user.id);
  }

  @Get()
  @AccessRoles(Roles.ADMIN, Roles.SUPER_ADMIN)
  @ApiOperation({ summary: 'Barcha transaction\'larni olish' })
  findAll() {
    return this.transactionService.findAll();
  }

  @Get('my')
  @AccessRoles(Roles.STUDENT)
  @ApiOperation({ summary: 'Student\'ning o\'z transaction\'larini olish' })
  getMyTransactions(@CurrentUser() user: IToken) {
    return this.transactionService.getStudentTransactions(user.id);
  }

  @Get('lesson/:lessonId')
  @ApiOperation({ summary: 'Lesson\'ga tegishli transaction\'ni olish' })
  getLessonTransaction(@Param('lessonId', ParseUUIDPipe) lessonId: string) {
    return this.transactionService.getLessonTransaction(lessonId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Transaction\'ni ID bo\'yicha olish' })
  @ApiResponse({ status: 404, description: 'Transaction topilmadi' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.transactionService.findOneById(id);
  }

  @Patch(':id/complete')
  @AccessRoles(Roles.ADMIN, Roles.SUPER_ADMIN)
  @ApiOperation({ summary: 'Transaction\'ni to\'lov qilish' })
  @ApiResponse({ status: 200, description: 'Transaction muvaffaqiyatli to\'landi' })
  complete(@Param('id', ParseUUIDPipe) id: string) {
    return this.transactionService.completeTransaction(id);
  }

  @Patch(':id/cancel')
  @AccessRoles(Roles.ADMIN, Roles.SUPER_ADMIN, Roles.STUDENT)
  @ApiOperation({ summary: 'Transaction\'ni bekor qilish' })
  @ApiResponse({ status: 200, description: 'Transaction muvaffaqiyatli bekor qilindi' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelTransactionDto,
  ) {
    return this.transactionService.cancelTransaction(id, dto);
  }

  @Patch(':id')
  @AccessRoles(Roles.ADMIN, Roles.SUPER_ADMIN)
  @ApiOperation({ summary: 'Transaction\'ni yangilash' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ) {
    return this.transactionService.update(id, updateTransactionDto);
  }

  @Delete(':id')
  @AccessRoles(Roles.ADMIN, Roles.SUPER_ADMIN)
  @ApiOperation({ summary: 'Transaction\'ni o\'chirish' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.transactionService.delete(id);
  }
}
