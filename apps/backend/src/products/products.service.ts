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
}
