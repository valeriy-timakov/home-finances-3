import { ApiProperty } from '@nestjs/swagger';

export class CurrencyDto {
  @ApiProperty({ description: 'The unique identifier of the currency' })
  id: number;

  @ApiProperty({ description: 'The full name of the currency (e.g., US Dollar)' })
  name: string;

  @ApiProperty({ description: 'The currency code (e.g., USD, EUR, UAH)' })
  code: string;

  @ApiProperty({ description: 'The currency symbol (e.g., $, €, ₴)' })
  symbol: string;

  @ApiProperty({ description: 'The name of the fractional part of the currency (e.g., Cent, Kopeck)' })
  fractionalPartName: string;

  @ApiProperty({ description: 'The number of fractional parts in one whole unit (e.g., 100 for dollars to cents)' })
  partFraction: number;
}
