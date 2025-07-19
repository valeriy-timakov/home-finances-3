import { Type } from 'class-transformer';
import { IsArray, IsDate, IsNotEmpty, IsNumber, IsInt, IsString, ValidateNested, Min, IsOptional } from 'class-validator';

class TransactionDetailDto {
  @IsInt()
  productOrServiceId: number;

  @IsNumber()
  @Min(0.01)
  quantity: number;

  @IsNumber()
  @Min(0.01)
  pricePerUnit: number;
}

export class CreateTransactionDto {
  @IsInt()
  accountId: number;

  @IsInt()
  counterpartyId: number;

  @IsNumber()
  @Min(0.01)
  amount: number; // Загальна сума транзакції

  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionDetailDto)
  details: TransactionDetailDto[];
}