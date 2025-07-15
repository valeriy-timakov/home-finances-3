import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Ваш сервіс для роботи з Prisma
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async create(createTransactionDto: CreateTransactionDto, userId: number) {
    const { userAccountId, counterpartyId, details, amount } = createTransactionDto;

    // 1. Перевіряємо, чи сума вказана вірно
    const calculatedAmount = details.reduce((sum, item) => sum + item.quantity * item.pricePerUnit, 0);
    if (Math.abs(calculatedAmount - amount) > 0.01) { // Порівняння з похибкою
      throw new BadRequestException('Total amount does not match the sum of details.');
    }

    // 2. Перевіряємо, чи рахунки належать користувачу
    const userAccount = await this.prisma.account.findFirst({ where: { id: userAccountId, userId } });
    const counterpartyAccount = await this.prisma.account.findFirst({ where: { id: counterpartyId, userId } });

    if (!userAccount || !counterpartyAccount) {
      throw new NotFoundException('One of the accounts not found or does not belong to the user.');
    }

    // 3. Створюємо транзакцію та її деталізацію в рамках однієї DB-транзакції
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          name: createTransactionDto.name,
          description: createTransactionDto.description,
          amount,
          date: createTransactionDto.date,
          userId,
          userAccountId,
          counterpartyId,
        },
      });

      await tx.transactionDetail.createMany({
        data: details.map((detail) => ({
          ...detail,
          transactionId: transaction.id,
        })),
      });

      return transaction;
    });
  }

  async findAll(query: QueryTransactionDto, userId: number) {
    const { userAccountId, categoryId, productName, startDate, endDate } = query;

    const whereClause: any = {
      userId,
    };

    if (userAccountId) {
      whereClause.userAccountId = userAccountId;
    }

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date.gte = startDate;
      if (endDate) whereClause.date.lte = endDate;
    }

    // Фільтрація за вкладеними сутностями
    if (categoryId || productName) {
      whereClause.details = {
        some: {
          productOrService: {}
        }
      };
      if(categoryId) {
        whereClause.details.some.productOrService.categoryId = categoryId;
      }
      if(productName) {
        whereClause.details.some.productOrService.name = {
          contains: productName,
          mode: 'insensitive' // Пошук без урахування регістру
        };
      }
    }

    return this.prisma.transaction.findMany({
      where: whereClause,
      include: { // Включаємо пов'язані дані для повноти відповіді
        userAccount: true,
        counterparty: true,
        details: {
          include: {
            productOrService: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
  }
}