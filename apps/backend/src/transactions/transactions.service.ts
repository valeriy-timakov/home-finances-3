import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Ваш сервіс для роботи з Prisma
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { CategoryDto, ProductOrServiceDto, TransactionDetailDto, TransactionDto, toCategoryDto, toProductOrServiceDto, toTransactionDetailDto, toTransactionDto } from '../dto/prisma-dto';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async create(createTransactionDto: CreateTransactionDto, agentId: number) {
    const { accountId, counterpartyId, details, amount } = createTransactionDto;

    // 1. Перевіряємо, чи сума вказана вірно
    const calculatedAmount = details.reduce((sum, item) => sum + item.quantity * item.pricePerUnit, 0);
    if (Math.abs(calculatedAmount - amount) > 0.01) { // Порівняння з похибкою
      throw new BadRequestException('Total amount does not match the sum of details.');
    }

    // 2. Перевіряємо, чи рахунки належать користувачу
    const userAccount = await this.prisma.account.findFirst({ where: { id: accountId, agentId } });
    const counterpartyAccount = await this.prisma.account.findFirst({ where: { id: counterpartyId, agentId } });

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
          agentId,
          accountId,
          counterpartyId,
        },
      });

      await tx.transactionDetail.createMany({
        data: details.map((detail) => ({
          ...detail,
          transactionId: transaction.id,
          agentId,
        })),
      });

      return transaction;
    });
  }

  // Рекурсивно будує шлях категорії
  private async getCategoryPath(category: any): Promise<string> {
    if (!category) return '';
    if (!category.superCategoryId) return category.name;
    const superCategory = await this.prisma.category.findUnique({ where: { id: category.superCategoryId, agentId: category.agentId } });
    const parentPath = await this.getCategoryPath(superCategory);
    return parentPath ? `${parentPath}/${category.name}` : category.name;
  }

  async findAll(query: QueryTransactionDto, agentId: number) {
    const { accountId, categoryId, productName, startDate, endDate } = query;

    const whereClause: any = {
      agentId,
    };

    if (accountId) {
      whereClause.accountId = accountId;
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

    const transactions = await this.prisma.transaction.findMany({
      where: whereClause,
      include: {
        account: true,
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

    // Мапа категорій по id
    const categoriesMap = transactions
      .flatMap(tx => tx.details)
      .map(detail => detail.productOrService?.category)
      .filter((cat): cat is NonNullable<typeof transactions[0]["details"][0]["productOrService"]["category"]> => !!cat)
      .reduce((acc, cat) => {
        if (!acc[cat.id]) acc[cat.id] = toCategoryDto(cat as any);
        return acc;
      }, {} as Record<number, CategoryDto>);

    for (const category of Object.values(categoriesMap)) {
      category.categoryPath = await this.getCategoryPath({ ...category, agentId });
      category.categoryId = category.id;
    }

    // Трансформуємо всі дані у DTO
    const transactionsDto: TransactionDto[] = transactions.map(tx =>
      toTransactionDto(
        tx as any,
        tx.details.map(detail =>
          toTransactionDetailDto(
            detail as any,
            toProductOrServiceDto(
              detail.productOrService as any,
              categoriesMap[detail.productOrService.categoryId]
            ),
            categoriesMap[detail.productOrService.categoryId]?.categoryPath
          )
        )
      )
    );

    return transactionsDto;
  }
}