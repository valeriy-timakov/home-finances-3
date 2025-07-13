import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.prisma.$connect();
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }

  get account() {
    return this.prisma.account;
  }

  get transaction() {
    return this.prisma.transaction;
  }

  get transactionDetail() {
    return this.prisma.transactionDetail;
  }

  get user() {
    return this.prisma.user;
  }

  get category() {
    return this.prisma.category;
  }

  get productOrService() {
    return this.prisma.productOrService;
  }

  $transaction<R>(fn: (prisma: PrismaClient) => Promise<R>): Promise<R> {
    return this.prisma.$transaction(fn);
  }
}
