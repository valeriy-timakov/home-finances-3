import { Controller, Post, Body, Get, Query, UseGuards, Req } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Імітуємо захист роутів

// @UseGuards(JwtAuthGuard) // Застосовуємо гард до всіх методів контролера
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  create(
    @Body() createTransactionDto: CreateTransactionDto,
    // @Req() req // Зазвичай ID користувача беруть з об'єкта запиту після проходження гарда
  ) {
    // В реальному проєкті userId буде отримано з JWT токена
    // Наприклад: const userId = req.user.id;
    const mockUserId = 1; // Для прикладу використовуємо мок
    return this.transactionsService.create(createTransactionDto, mockUserId);
  }

  @Get()
  findAll(
    @Query() query: QueryTransactionDto,
    // @Req() req
  ) {
    const mockUserId = 1; // Аналогічно
    return this.transactionsService.findAll(query, mockUserId);
  }
}