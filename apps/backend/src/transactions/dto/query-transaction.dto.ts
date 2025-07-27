import { Transform, Type } from 'class-transformer';
import { IsArray, IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class QueryTransactionDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  accountId?: number;

  @IsOptional()
  @Transform(({ value }) => {
    // Handle single string value
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? [] : [parsed];
    }
    
    // Handle array of values
    if (Array.isArray(value)) {
      return value.map(v => typeof v === 'string' ? parseInt(v, 10) : v).filter(v => !isNaN(v));
    }
    
    // Handle numeric value
    if (typeof value === 'number') {
      return [value];
    }
    
    return [];
  })
  categoryIds?: number[];

  @IsOptional()
  @Transform(({ value }) => {
    // Handle single string value
    if (typeof value === 'string') {
      return [value.trim()];
    }
    
    // Handle array of values
    if (Array.isArray(value)) {
      return value.map(v => String(v).trim());
    }
    
    return [];
  })
  productNames?: string[];

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  counterpartyId?: number;

  @IsOptional()
  @IsString()
  searchText?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') return undefined;
    const parsed = typeof value === 'string' ? parseInt(value, 10) : value;
    return isNaN(parsed) ? undefined : parsed;
  })
  minAmount?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') return undefined;
    const parsed = typeof value === 'string' ? parseInt(value, 10) : value;
    return isNaN(parsed) ? undefined : parsed;
  })
  maxAmount?: number;

  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => {
    if (!value) return undefined;
    const date = new Date(value);
    return isNaN(date.getTime()) ? undefined : date;
  })
  startDate?: Date;

  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => {
    if (!value) return undefined;
    const date = new Date(value);
    return isNaN(date.getTime()) ? undefined : date;
  })
  endDate?: Date;
}