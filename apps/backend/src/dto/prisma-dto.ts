// DTOs for all Prisma models (transient fields allowed)
import { Category, ProductOrService, Transaction, TransactionDetail, Account, Agent, MeasureUnit, User } from '@prisma/client';

export interface CategoryDto extends Category {
  categoryPath?: string;
  categoryId?: number;
}

export interface ProductOrServiceDto extends ProductOrService {
  category?: CategoryDto;
}

export interface TransactionDetailDto extends TransactionDetail {
  productOrService?: ProductOrServiceDto;
  categoryPath?: string;
}

export interface TransactionDto extends Transaction {
  details?: TransactionDetailDto[];
}

export interface AccountDto extends Account {}
export interface AgentDto extends Agent {}
export interface MeasureUnitDto extends MeasureUnit {}
export interface UserDto extends User {}

// Маппери для перетворення об'єктів Prisma у DTO
export function toCategoryDto(category: Category): CategoryDto {
  return { ...category };
}

export function toProductOrServiceDto(pos: ProductOrService, category?: CategoryDto): ProductOrServiceDto {
  return { ...pos, category };
}

export function toTransactionDetailDto(detail: TransactionDetail, productOrService?: ProductOrServiceDto, categoryPath?: string): TransactionDetailDto {
  return { ...detail, productOrService, categoryPath };
}

export function toTransactionDto(
  transaction: Transaction,
  details?: TransactionDetailDto[]
): TransactionDto {
  return { ...transaction, details };
}
