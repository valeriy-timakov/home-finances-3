import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CategoryDto } from '../dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAllTree(): Promise<CategoryDto[]> {
    // Отримати всі категорії з agentId (поки без фільтрації)
    const categories = await this.prisma.category.findMany({
      select: {
        id: true,
        name: true,
        superCategoryId: true,
      },
      orderBy: { id: 'asc' },
    });
    // Fix: convert null to undefined for superCategoryId
    const map = new Map<number, CategoryDto & { children: CategoryDto[] }>();
    categories.forEach(cat => map.set(cat.id, {
      ...cat,
      superCategoryId: cat.superCategoryId ?? undefined,
      children: [],
    }));
    const tree: CategoryDto[] = [];
    map.forEach(cat => {
      if (cat.superCategoryId) {
        map.get(cat.superCategoryId)?.children.push(cat);
      } else {
        tree.push(cat);
      }
    });
    return tree;
  }
}
