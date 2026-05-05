import type { PrismaClient } from "@prisma/client";

export class CategoryService {
  constructor(private readonly db: PrismaClient) {}

  async listByBudgie(budgieId: string) {
    return this.db.category.findMany({
      where: { budgieId },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { costCategories: true } },
      },
    });
  }

  async getById(id: string) {
    return this.db.category.findUnique({
      where: { id },
    });
  }

  /**
   * Returns the number of cost rows that reference this category.
   * Used to block delete when the category is in use.
   */
  async countCostsByCategoryId(id: string): Promise<number> {
    return this.db.costCategory.count({
      where: { categoryId: id },
    });
  }

  async create(budgieId: string, name: string, color: string) {
    return this.db.category.create({
      data: {
        budgieId,
        name: name.trim(),
        color,
      },
    });
  }

  async update(id: string, data: { name?: string; color?: string }) {
    return this.db.category.update({
      where: { id },
      data: {
        name: data.name?.trim(),
        color: data.color,
      },
    });
  }

  async delete(id: string) {
    return this.db.category.delete({
      where: { id },
    });
  }

  /**
   * Replace the set of categories linked to a single cost atomically.
   * Caller must validate that all categoryIds belong to the same budgie
   * as the cost.
   */
  async setCategoriesForCost(costId: string, categoryIds: string[]) {
    const uniqueIds = Array.from(new Set(categoryIds));
    return this.db.$transaction([
      this.db.costCategory.deleteMany({ where: { costId } }),
      ...(uniqueIds.length > 0
        ? [
            this.db.costCategory.createMany({
              data: uniqueIds.map((categoryId) => ({ costId, categoryId })),
            }),
          ]
        : []),
    ]);
  }
}
