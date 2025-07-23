export interface CurrencyDto {
  id: number;
  name: string;
  code: string;
  symbol: string;
  fractionalPartName: string;
  partFraction: number;
}

export interface AccountDto {
  id: number;
  name: string;
  type: 'OWN' | 'COUNTERPARTY';
  description?: string;
  agentId: number;
  currency: CurrencyDto;
}

export interface TransactionDetailDto {
  id: number;
  transactionId: number;
  productOrServiceId: number;
  quantity: number;
  pricePerUnit: number;
  productOrService?: {
    id: number;
    name: string;
    category?: {
      id: number;
      name: string;
      categoryPath?: string;
    };
    unit?: {
      id: number;
      shortName: string;
    };
  };
  categoryPath?: string;
}

export interface TransactionDto {
  id: number;
  name: string;
  description?: string;
  amount: number;
  date: string;
  account: AccountDto;
  counterparty: AccountDto;
  agentId: number;
  details?: TransactionDetailDto[];
}
