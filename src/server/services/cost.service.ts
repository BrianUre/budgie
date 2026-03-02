import type { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export class CostService {
  constructor(private readonly db: PrismaClient) {}

  async getById(costId: string) {
    return this.db.cost.findUnique({
      where: { id: costId },
      include: { month: true },
    });
  }

  async listForMonth(monthId: string) {
    return this.db.cost.findMany({
      where: { monthId },
      include: {
        expense: true,
        contributions: true,
      },
    });
  }

  async updateAmount(costId: string, amount: number) {
    return this.db.cost.update({
      where: { id: costId },
      data: { amount: new Decimal(amount) },
    });
  }

  async getOrCreate(monthId: string, expenseId: string, amount: number) {
    const existing = await this.db.cost.findUnique({
      where: {
        monthId_expenseId: { monthId, expenseId },
      },
    });
    if (existing) return existing;
    return this.db.cost.create({
      data: {
        monthId,
        expenseId,
        amount: new Decimal(amount),
      },
    });
  }
}

export type Cost = Awaited<
  ReturnType<CostService["getById"]>
>;

export type Costs = Awaited<
  ReturnType<CostService["listForMonth"]>
>;
