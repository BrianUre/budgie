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

  async setActive(costId: string, isActive: boolean) {
    return this.db.cost.update({
      where: { id: costId },
      data: { isActive },
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
        isActive: true,
      },
    });
  }

  /**
   * Add an existing expense as a cost to a month (creates cost + default contributions).
   * Idempotent: if cost already exists for this month/expense, returns it.
   */
  async createForMonth(
    monthId: string,
    expenseId: string,
    amount: number,
    budgieId: string
  ) {
    const existing = await this.db.cost.findUnique({
      where: {
        monthId_expenseId: { monthId, expenseId },
      },
    });
    if (existing) return existing;

    const contributors = await this.db.contributor.findMany({
      where: { budgieId },
    });
    if (contributors.length === 0) {
      throw new Error("No contributors found");
    }

    return this.db.$transaction(async (tx) => {
      const cost = await tx.cost.create({
        data: {
          monthId,
          expenseId,
          amount: new Decimal(amount),
          isActive: true,
        },
      });
      const contributorCount = contributors.length;
      const basePercentage = Math.floor((100 / contributorCount) * 100) / 100;
      const remainder =
        Math.round((100 - basePercentage * contributorCount) * 100) / 100;
      await tx.contribution.createMany({
        data: contributors.map((contributor, index) => ({
          costId: cost.id,
          contributorId: contributor.id,
          percentage: new Decimal(
            index === 0 ? basePercentage + remainder : basePercentage
          ),
        })),
      });
      return cost;
    });
  }
}

export type Cost = Awaited<
  ReturnType<CostService["getById"]>
>;

export type Costs = Awaited<
  ReturnType<CostService["listForMonth"]>
>;
