import { Transform, Type } from 'class-transformer';
import { IsArray, IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class QueryTransactionDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  accountId?: number;

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  categoryIds?: number[];

  @IsOptional()
  @IsArray()
  @Type(() => String)
  productNames?: string[];

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  counterpartyId?: number;

  @IsOptional()
  @IsString()
  searchText?: string;

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