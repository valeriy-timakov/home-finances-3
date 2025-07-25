import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CategoryDto } from '../dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAllTree(agentId: number): Promise<CategoryDto[]> {
    // Отримати всі категорії з agentId (поки без фільтрації)
    const categories = await this.prisma.category.findMany({
      where: {
        agentId,
      },
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

  async findSelectItems(agentId: number) {
    // Отримати всі категорії з agentId
    const categories = await this.prisma.category.findMany({
      where: {
        agentId,
      },
      select: {
        id: true,
        name: true,
        superCategoryId: true,
      },
      orderBy: { name: 'asc' },
    });

    // Створюємо мапу для побудови повних шляхів категорій
    const map = new Map<number, { id: number; name: string; superCategoryId: number | null }>();
    categories.forEach(cat => map.set(cat.id, cat));

    // Функція для отримання повного шляху категорії
    const getCategoryPath = (categoryId: number): string => {
      const category = map.get(categoryId);
      if (!category) return '';
      if (category.superCategoryId === null) return category.name;
      return `${getCategoryPath(category.superCategoryId)} > ${category.name}`;
    };

    // Формуємо список селект-айтемів з уніфікованим форматом
    return categories.map(category => ({
      id: category.id,
      label: getCategoryPath(category.id)
    }));
  }
}
