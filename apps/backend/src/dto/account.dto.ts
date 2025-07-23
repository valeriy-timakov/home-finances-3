import { ApiProperty } from '@nestjs/swagger';
import { CurrencyDto } from './currency.dto';

export class AccountDto {
  @ApiProperty({ description: 'The unique identifier of the account' })
  id: number;

  @ApiProperty({ description: 'The name of the account' })
  name: string;

  @ApiProperty({ description: 'The type of the account (OWN or COUNTERPARTY)', enum: ['OWN', 'COUNTERPARTY'] })
  type: 'OWN' | 'COUNTERPARTY';

  @ApiProperty({ description: 'Optional description of the account', required: false })
  description?: string;

  @ApiProperty({ description: 'The currency used by this account' })
  currency: CurrencyDto;

  @ApiProperty({ description: 'The ID of the agent who owns this account' })
  agentId: number;
}
