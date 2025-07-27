import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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

  async create(categoryDto: CategoryDto, agentId: number) {
    // Перевіряємо, чи існує надкатегорія, якщо вона вказана
    if (categoryDto.superCategoryId) {
      const superCategory = await this.prisma.category.findUnique({
        where: { id: categoryDto.superCategoryId },
      });
      
      if (!superCategory) {
        throw new NotFoundException(`Super category with ID ${categoryDto.superCategoryId} not found`);
      }
      
      if (superCategory.agentId !== agentId) {
        throw new ForbiddenException('You do not have access to this super category');
      }
    }

    // Створюємо нову категорію
    return this.prisma.category.create({
      data: {
        name: categoryDto.name,
        superCategoryId: categoryDto.superCategoryId || null,
        agentId,
      },
    });
  }

  async update(id: number, categoryDto: CategoryDto, agentId: number) {
    // Перевіряємо, чи існує категорія та чи має користувач до неї доступ
    const existingCategory = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    if (existingCategory.agentId !== agentId) {
      throw new ForbiddenException('You do not have access to this category');
    }

    // Перевіряємо, чи існує надкатегорія, якщо вона вказана
    if (categoryDto.superCategoryId) {
      // Перевіряємо, щоб не створити циклічну залежність
      if (categoryDto.superCategoryId === id) {
        throw new ForbiddenException('Category cannot be its own parent');
      }

      const superCategory = await this.prisma.category.findUnique({
        where: { id: categoryDto.superCategoryId },
      });

      if (!superCategory) {
        throw new NotFoundException(`Super category with ID ${categoryDto.superCategoryId} not found`);
      }

      if (superCategory.agentId !== agentId) {
        throw new ForbiddenException('You do not have access to this super category');
      }

      // Перевіряємо, щоб не створити циклічну залежність через вкладені категорії
      const isChildOfTarget = await this.isChildOf(categoryDto.superCategoryId, id);
      if (isChildOfTarget) {
        throw new ForbiddenException('Cannot create cyclic dependency in category hierarchy');
      }
    }

    // Оновлюємо категорію
    return this.prisma.category.update({
      where: { id },
      data: {
        name: categoryDto.name,
        superCategoryId: categoryDto.superCategoryId || null,
      },
    });
  }

  async remove(id: number, agentId: number) {
    // Перевіряємо, чи існує категорія та чи має користувач до неї доступ
    const existingCategory = await this.prisma.category.findUnique({
      where: { id },
      include: { subCategories: true }
    });

    if (!existingCategory) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    if (existingCategory.agentId !== agentId) {
      throw new ForbiddenException('You do not have access to this category');
    }

    // Перевіряємо, чи є продукти, пов'язані з цією категорією
    const productsWithCategory = await this.prisma.productOrService.findFirst({
      where: {
        categoryId: id,
        agentId: agentId
      }
    });

    if (productsWithCategory) {
      throw new ForbiddenException('Існують продукти, що використовують дану категорію - видалення не можливе! Спочатку впевніться, що категорія, яка видаляється не прив\'язана до жодного продукту');
    }

    // Видаляємо категорію та всі її підкатегорії
    return this.prisma.$transaction(async (prisma) => {
      // Рекурсивно видаляємо всі підкатегорії
      await this.recursiveDelete(id, prisma);
      
      // Видаляємо саму категорію
      return prisma.category.delete({
        where: { id },
      });
    });
  }

  private async recursiveDelete(categoryId: number, prisma: any) {
    // Перевіряємо, чи є продукти, пов'язані з цією підкатегорією
    const productsWithCategory = await prisma.productOrService.findFirst({
      where: {
        categoryId: categoryId
      }
    });

    if (productsWithCategory) {
      throw new ForbiddenException(`Існують продукти, що використовують категорію з ID ${categoryId} - видалення не можливе!`);
    }

    const children = await prisma.category.findMany({
      where: { superCategoryId: categoryId },
    });

    for (const child of children) {
      await this.recursiveDelete(child.id, prisma);
    }
  }

  private async isChildOf(potentialChildId: number, potentialParentId: number): Promise<boolean> {
    const potentialChild = await this.prisma.category.findUnique({
      where: { id: potentialChildId },
    });

    if (!potentialChild || potentialChild.superCategoryId === null) {
      return false;
    }

    if (potentialChild.superCategoryId === potentialParentId) {
      return true;
    }

    return this.isChildOf(potentialChild.superCategoryId, potentialParentId);
  }
}
