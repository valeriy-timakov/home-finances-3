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
    const { accountId, categoryIds, productNames, startDate, endDate, counterpartyId, searchText } = query;

    const whereClause: any = {
      agentId,
    };

    if (accountId) {
      whereClause.accountId = accountId;
    }

    if (counterpartyId) {
      whereClause.counterpartyId = counterpartyId;
    }

    if (searchText) {
      whereClause.name = {
        contains: searchText,
        mode: 'insensitive'
      };
    }

    if (startDate || endDate) {
      whereClause.date = {};
      
      // Ensure proper ISO-8601 DateTime format for Prisma
      if (startDate) {
        // If startDate is a string, ensure it's a valid ISO date string
        if (typeof startDate === 'string') {
          try {
            // Create a Date object and format it as ISO string
            const date = new Date(startDate);
            if (!isNaN(date.getTime())) {
              whereClause.date.gte = date.toISOString();
            }
          } catch (e) {
            console.error('Invalid startDate format:', startDate, e);
          }
        } else {
          // If it's already a Date object, just convert to ISO string
          whereClause.date.gte = startDate.toISOString();
        }
      }
      
      if (endDate) {
        // If endDate is a string, ensure it's a valid ISO date string
        if (typeof endDate === 'string') {
          try {
            // Create a Date object and format it as ISO string
            const date = new Date(endDate);
            if (!isNaN(date.getTime())) {
              whereClause.date.lte = date.toISOString();
            }
          } catch (e) {
            console.error('Invalid endDate format:', endDate, e);
          }
        } else {
          // If it's already a Date object, just convert to ISO string
          whereClause.date.lte = endDate.toISOString();
        }
      }
    }

    // Фільтрація за вкладеними сутностями
    if ((categoryIds && categoryIds.length > 0) || (productNames && productNames.length > 0)) {
      whereClause.details = {
        some: {}
      };
      
      if (categoryIds && categoryIds.length > 0) {
        whereClause.details.some.productOrService = {
          categoryId: {
            in: categoryIds
          }
        };
      }
      
      if (productNames && productNames.length > 0) {
        if (!whereClause.details.some.productOrService) {
          whereClause.details.some.productOrService = {};
        }
        
        whereClause.details.some.productOrService.name = {
          in: productNames
        };
      }
    }

    const transactions = await this.prisma.transaction.findMany({
      where: whereClause,
      include: {
        account: {
          include: {
            currency: true,
          },
        },
        counterparty: {
          include: {
            currency: true,
          },
        },
        details: {
          include: {
            productOrService: {
              include: {
                category: true,
                unit: true,
                pieceSizeUnit: true,
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
    const transactionsDto: TransactionDto[] = [];
    
    for (const tx of transactions) {
      // Map details with categories
      const details = tx.details.map(detail => {
        const categoryId = detail.productOrService.categoryId;
        const category = categoryId ? categoriesMap[categoryId] : undefined;
        return toTransactionDetailDto(
          detail as any,
          toProductOrServiceDto({
            ...detail.productOrService as any,
            category: category,
            unit: detail.productOrService.unit,
            pieceSizeUnit: detail.productOrService.pieceSizeUnit
          }),
          category?.categoryPath
        );
      });
      
      // Create transaction DTO with all required fields
      const transactionDto = toTransactionDto(
        {
          ...tx,
          account: tx.account,
          counterparty: tx.counterparty,
        } as any,
        details
      );
      
      transactionsDto.push(transactionDto);
    }

    return transactionsDto;
  }
}