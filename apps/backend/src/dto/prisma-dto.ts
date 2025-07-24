// DTOs for all Prisma models (transient fields allowed)
import { Category, ProductOrService, Transaction, TransactionDetail, Account, Agent, MeasureUnit, User, Currency } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export interface CurrencyDto {
  id: number;
  name: string;
  code: string;
  symbol: string;
  fractionalPartName: string;
  partFraction: number;
}

export interface CategoryDto extends Category {
  categoryPath?: string;
  categoryId?: number;
}

export interface ProductOrServiceDto extends ProductOrService {
  category?: CategoryDto;
  unit?: MeasureUnitDto;
  pieceSizeUnit?: MeasureUnitDto;
}

export class TransactionDetailDto {
  @ApiProperty({ required: false })
  productOrService?: ProductOrServiceDto;

  @ApiProperty({ required: false })
  categoryPath?: string;
}

export class TransactionDto {
  @ApiProperty({ description: 'The unique identifier of the transaction' })
  id: number;

  @ApiProperty({ description: 'The name of the transaction' })
  name: string;

  @ApiProperty({ description: 'The description of the transaction', required: false })
  description?: string;

  @ApiProperty({ description: 'The amount of the transaction in the smallest currency unit' })
  amount: number;

  @ApiProperty({ description: 'The date of the transaction' })
  date: Date;

  @ApiProperty({ description: 'The account associated with this transaction', type: Object })
  account: AccountDto;

  @ApiProperty({ description: 'The counterparty account for this transaction', type: Object })
  counterparty: AccountDto;

  @ApiProperty({ description: 'The agent ID who owns this transaction' })
  agentId: number;

  @ApiProperty({
    description: 'The transaction details',
    type: TransactionDetailDto,
    isArray: true,
    required: false
  })
  details?: TransactionDetailDto[];
}

export interface AccountDto extends Account {
  currency?: CurrencyDto;
}

export interface AgentDto extends Agent {}

export class MeasureUnitDto {
  @ApiProperty({ description: 'The unique identifier of the measurement unit' })
  id: number;

  @ApiProperty({ description: 'The full name of the measurement unit' })
  name: string;

  @ApiProperty({ description: 'The abbreviated name of the measurement unit' })
  shortName: string;

  @ApiProperty({ description: 'The local code of the measurement unit' })
  local_code: string;
}

export interface UserDto extends User {}

// Маппери для перетворення об'єктів Prisma у DTO
export function toCategoryDto(category: Category): CategoryDto {
  return { ...category };
}

export function toMeasureUnitDto(unit: MeasureUnit): MeasureUnitDto {
  const dto = new MeasureUnitDto();
  dto.id = unit.id;
  dto.name = unit.name;
  dto.shortName = unit.shortName;
  dto.local_code = unit.local_code;
  return dto;
}

export function toProductOrServiceDto(
  pos: ProductOrService & { 
    category?: Category;
    unit?: MeasureUnit;
    pieceSizeUnit?: MeasureUnit;
  }
): ProductOrServiceDto {
  return { 
    ...pos, 
    category: pos.category ? toCategoryDto(pos.category) : undefined,
    unit: pos.unit ? toMeasureUnitDto(pos.unit) : undefined,
    pieceSizeUnit: pos.pieceSizeUnit ? toMeasureUnitDto(pos.pieceSizeUnit) : undefined
  };
}

export function toTransactionDetailDto(detail: TransactionDetail, productOrService?: ProductOrServiceDto, categoryPath?: string): TransactionDetailDto {
  return { ...detail, productOrService, categoryPath };
}

export function toTransactionDto(
  transaction: Transaction & {
    account: Account & { currency: Currency };
    counterparty: Account & { currency: Currency };
  },
  details?: TransactionDetailDto[]
): TransactionDto {
  const transactionDto = new TransactionDto();
  
  // Map basic transaction fields
  transactionDto.id = transaction.id;
  transactionDto.name = transaction.name;
  transactionDto.description = transaction.description ?? undefined;
  transactionDto.amount = transaction.amount;
  transactionDto.date = transaction.date;
  transactionDto.agentId = transaction.agentId;
  transactionDto.details = details;
  
  // Map account with currency
  transactionDto.account = {
    id: transaction.account.id,
    name: transaction.account.name,
    type: transaction.account.type as 'OWN' | 'COUNTERPARTY',
    description: transaction.account.description ?? null,
    agentId: transaction.account.agentId,
    currencyId: transaction.account.currencyId,
    currency: {
      id: transaction.account.currency.id,
      name: transaction.account.currency.name,
      code: transaction.account.currency.code,
      symbol: transaction.account.currency.symbol,
      fractionalPartName: transaction.account.currency.fractionalPartName,
      partFraction: transaction.account.currency.partFraction,
    }
  };
  
  // Map counterparty with currency
  transactionDto.counterparty = {
    id: transaction.counterparty.id,
    name: transaction.counterparty.name,
    type: transaction.counterparty.type as 'OWN' | 'COUNTERPARTY',
    description: transaction.counterparty.description ?? null,
    agentId: transaction.counterparty.agentId,
    currencyId: transaction.counterparty.currencyId,
    currency: {
      id: transaction.counterparty.currency.id,
      name: transaction.counterparty.currency.name,
      code: transaction.counterparty.currency.code,
      symbol: transaction.counterparty.currency.symbol,
      fractionalPartName: transaction.counterparty.currency.fractionalPartName,
      partFraction: transaction.counterparty.currency.partFraction,
    }
  };
  
  return transactionDto;
}
