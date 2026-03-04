import type { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export class ExpenseService {
  constructor(private readonly db: PrismaClient) {}

  async listForBudgie(budgieId: string) {
    return this.db.expense.findMany({
      where: { budgieId },
      orderBy: { name: "asc" },
    });
  }

  async create(
    data: { budgieId: string; name: string; initialAmount: number },
    monthId: string
  ) {
    return this.db.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          budgieId: data.budgieId,
          name: data.name,
        },
      });
      const cost = await tx.cost.create({
        data: {
          monthId,
          expenseId: expense.id,
          amount: new Decimal(data.initialAmount),
        },
      });

      const contributors = await tx.contributor.findMany({
        where: { budgieId: data.budgieId },
      });
      
      if (contributors.length === 0) {
        throw new Error("No contributors found");
      }
      const contributorCount = contributors.length;
      const basePercentage = Math.floor((100 / contributorCount) * 100) / 100;
      const remainder = Math.round((100 - basePercentage * contributorCount) * 100) / 100;
      await tx.contribution.createMany({
        data: contributors.map((contributor, index) => ({
          costId: cost.id,
          contributorId: contributor.id,
          percentage: new Decimal(index === 0 ? basePercentage + remainder : basePercentage),
        })),
      });

      return expense;
    });
  }
}
