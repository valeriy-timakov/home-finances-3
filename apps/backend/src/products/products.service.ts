import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findSelectItems(agentId: number) {
    // Отримати всі продукти з agentId
    const products = await this.prisma.productOrService.findMany({
      where: {
        agentId,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    });

    // Повертаємо список селект-айтемів для продуктів у уніфікованому форматі
    return products.map(product => ({
      id: product.id,
      label: product.name
    }));
  }

  async findProductsByCategory(agentId: number, categoryId?: number) {
    // Отримати всі продукти з agentId, що належать до вказаної категорії
    return this.prisma.productOrService.findMany({
      where: {
        agentId,
        categoryId: categoryId || null,
      },
      select: {
        id: true,
        name: true,
        categoryId: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findProductsNotInCategory(agentId: number, categoryId?: number) {
    // Отримати всі продукти з agentId, що НЕ належать до вказаної категорії
    return this.prisma.productOrService.findMany({
      where: {
        agentId,
        NOT: {
          categoryId: categoryId || null,
        },
      },
      select: {
        id: true,
        name: true,
        categoryId: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async moveProductsToCategory(agentId: number, sourceCategoryId: number, targetCategoryId: number | null) {
    // Find all products in the source category
    const products = await this.prisma.productOrService.findMany({
      where: {
        agentId,
        categoryId: sourceCategoryId,
      },
      select: {
        id: true,
      },
    });

    const productIds = products.map(product => product.id);

    // Update all products to the target category
    if (productIds.length > 0) {
      await this.prisma.productOrService.updateMany({
        where: {
          id: {
            in: productIds,
          },
        },
        data: {
          categoryId: targetCategoryId,
        },
      });
    }

    return { moved: productIds.length };
  }
}
