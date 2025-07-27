import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions_details.controller';
import { TransactionsService } from './transactions_details.service';

@Module({
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsDetailsModule {}