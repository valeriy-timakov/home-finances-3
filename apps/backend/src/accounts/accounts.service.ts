import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountDto } from '../dto/account.dto';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  async findAll(agentId: number): Promise<AccountDto[]> {
    const accounts = await this.prisma.account.findMany({
      where: {
        agentId,
      },
      include: {
        currency: true,
      },
    });

    return accounts.map(account => ({
      id: account.id,
      name: account.name,
      type: account.type as 'OWN' | 'COUNTERPARTY',
      description: account.description ?? undefined,
      agentId: account.agentId,
      currency: {
        id: account.currency.id,
        name: account.currency.name,
        code: account.currency.code,
        symbol: account.currency.symbol,
        fractionalPartName: account.currency.fractionalPartName,
        partFraction: account.currency.partFraction,
      },
    }));
  }
}
