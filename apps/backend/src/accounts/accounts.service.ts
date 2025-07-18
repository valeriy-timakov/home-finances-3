import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountDto } from '../dto/account.dto';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<AccountDto[]> {
    const accounts = await this.prisma.account.findMany({
      select: {
        id: true,
        name: true,
        description: true,
      },
    });
    // Fix: convert null to undefined
    return accounts.map(acc => ({
      ...acc,
      description: acc.description ?? undefined,
    }));
  }
}
