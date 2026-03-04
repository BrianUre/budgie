import type { PrismaClient } from "@prisma/client";

export class BudgieService {
  constructor(private readonly db: PrismaClient) {}

  async listForUser(userId: string) {
    return this.db.budgie.findMany({
      where: {
        contributors: { some: { userId, isAdmin: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async create(
    data: { name: string },
    userId: string
  ) {
    const now = new Date();
    const date = new Date(now.getFullYear(), now.getMonth(), 1);

    return this.db.$transaction(async (tx) => {
      const budgie = await tx.budgie.create({
        data: { name: data.name },
      });
      await tx.month.create({
        data: { budgieId: budgie.id, date },
      });
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error("User not found");
      await tx.contributor.create({
        data: {
          budgieId: budgie.id,
          name: user.email,
          isAdmin: true,
          userId,
        },
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
