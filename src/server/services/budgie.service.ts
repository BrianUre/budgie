import type { PrismaClient } from "@prisma/client";

export class BudgieService {
  constructor(private readonly db: PrismaClient) {}

  async listForUser(userId: string) {
    return this.db.budgie.findMany({
      where: { admins: { some: { userId } } },
      orderBy: { updatedAt: "desc" },
    });
  }

  async create(
    data: { name: string },
    userId: string
  ) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    return this.db.$transaction(async (tx) => {
      const budgie = await tx.budgie.create({
        data: { name: data.name },
      });
      await tx.month.create({
        data: { budgieId: budgie.id, year, month },
      });
      await tx.admin.create({
        data: { budgieId: budgie.id, userId },
      });
      return budgie;
    });
  }

  async getById(id: string) {
    return this.db.budgie.findUnique({
      where: { id },
    });
  }
}
