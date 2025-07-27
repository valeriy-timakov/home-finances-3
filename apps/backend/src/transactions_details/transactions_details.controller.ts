import { Controller, Post, Body, Get, Query, UseGuards, Req } from '@nestjs/common';
import { TransactionsService } from './transactions_details.service';
import { CreateTransactionDetailsDto } from './dto/create-transaction-details.dto';
import { QueryTransactionsDetailsDto } from './dto/query-transactions-details.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('bearer')) // Застосовуємо гард до всіх методів контролера
@Controller('transactions_details')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  create(
    @Body() createTransactionDto: CreateTransactionDetailsDto,
    @Req() req // Зазвичай ID користувача беруть з об'єкта запиту після проходження гарда
  ) {
    return this.transactionsService.create(createTransactionDto, req.user.agentId);
  }

  @Get()
  findAll(
    @Query() query: QueryTransactionsDetailsDto,
    @Req() req
  ) {
    return this.transactionsService.findAll(query, req.user.agentId);
  }
}