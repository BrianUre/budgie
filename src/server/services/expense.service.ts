import type { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

function firstDayOfMonth(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)
  );
}

export class ExpenseService {
  constructor(private readonly db: PrismaClient) {}

  async listForBudgie(
    budgieId: string,
    options?: { includeArchived?: boolean }
  ) {
    const includeArchived = options?.includeArchived ?? false;
    return this.db.expense.findMany({
      where: {
        budgieId,
        ...(includeArchived ? {} : { archived: false }),
      },
      orderBy: { name: "asc" },
    });
  }

  async archive(expenseId: string) {
    const expense = await this.db.expense.findUnique({
      where: { id: expenseId },
      include: { costs: true },
    });
    if (!expense) return;

    if (expense.costs.length === 0) {
      await this.db.expense.delete({ where: { id: expenseId } });
      return;
    }

    const archivedOn = firstDayOfMonth(new Date());
    await this.db.expense.update({
      where: { id: expenseId },
      data: { archived: true, archivedOn },
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
          isActive: true,
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
