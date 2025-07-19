import { Controller, Post, Body, Get, Query, UseGuards, Req } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('bearer')) // Застосовуємо гард до всіх методів контролера
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  create(
    @Body() createTransactionDto: CreateTransactionDto,
    @Req() req // Зазвичай ID користувача беруть з об'єкта запиту після проходження гарда
  ) {
    return this.transactionsService.create(createTransactionDto, req.user.agentId);
  }

  @Get()
  findAll(
    @Query() query: QueryTransactionDto,
    @Req() req
  ) {
    return this.transactionsService.findAll(query, req.user.agentId);
  }
}