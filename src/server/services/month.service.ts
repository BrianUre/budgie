import type { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

function firstDayOfMonth(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)
  );
}

export type CostOverride = {
  expenseId: string;
  isActive: boolean;
  amount: number;
};

export class MonthService {
  constructor(private readonly db: PrismaClient) {}

  async getById(monthId: string) {
    return this.db.month.findUnique({
      where: { id: monthId },
    });
  }

  async listForBudgie(budgieId: string) {
    return this.db.month.findMany({
      where: { budgieId },
      orderBy: { date: "desc" },
    });
  }

  async getOrCreateForBudgie(budgieId: string, date: Date) {
    const normalized = firstDayOfMonth(date);
    const existing = await this.db.month.findUnique({
      where: {
        budgieId_date: { budgieId, date: normalized },
      },
    });
    if (existing) return existing;
    return this.db.month.create({
      data: { budgieId, date: normalized },
    });
  }

  async getByBudgieAndDate(budgieId: string, date: Date) {
    const normalized = firstDayOfMonth(date);
    return this.db.month.findUnique({
      where: {
        budgieId_date: { budgieId, date: normalized },
      },
    });
  }

  async createNextForBudgie(
    budgieId: string,
    costOverrides?: CostOverride[]
  ) {
    const months = await this.listForBudgie(budgieId);
    const baseDate =
      months.length > 0
        ? (months[0]!.date as Date)
        : firstDayOfMonth(new Date());
    const nextDate = new Date(
      Date.UTC(
        baseDate.getUTCFullYear(),
        baseDate.getUTCMonth() + 1,
        1
      )
    );
    const newMonth = await this.getOrCreateForBudgie(budgieId, nextDate);

    if (costOverrides && costOverrides.length > 0) {
      await this.createCostsFromOverrides(budgieId, newMonth.id, costOverrides);
    } else if (months.length > 0) {
      const sourceMonthId = months[0]!.id;
      await this.duplicateCostsAndContributionsFromMonth(
        sourceMonthId,
        newMonth.id
      );
    }

    return newMonth;
  }

  /**
   * Create costs for the new month from explicit overrides (isActive + amount).
   * Copies contribution percentages from the latest month's cost per expense when available.
   */
  private async createCostsFromOverrides(
    budgieId: string,
    targetMonthId: string,
    costOverrides: CostOverride[]
  ) {
    const months = await this.listForBudgie(budgieId);
    const sourceMonthId = months[0]?.id ?? null;
    const sourceCosts = sourceMonthId
      ? await this.db.cost.findMany({
          where: { monthId: sourceMonthId },
          include: { contributions: true },
        })
      : [];
    const contributors = await this.db.contributor.findMany({
      where: { budgieId },
    });

    await this.db.$transaction(async (tx) => {
      for (const override of costOverrides) {
        const newCost = await tx.cost.create({
          data: {
            monthId: targetMonthId,
            expenseId: override.expenseId,
            amount: new Decimal(override.amount),
            isActive: override.isActive,
          },
        });
        const sourceCost = sourceCosts.find(
          (cost) => cost.expenseId === override.expenseId
        );
        if (sourceCost?.contributions.length) {
          await tx.contribution.createMany({
            data: sourceCost.contributions.map((contribution) => ({
              costId: newCost.id,
              contributorId: contribution.contributorId,
              percentage: contribution.percentage,
            })),
          });
        } else if (contributors.length > 0) {
          const contributorCount = contributors.length;
          const basePercentage = Math.floor((100 / contributorCount) * 100) / 100;
          const remainder =
            Math.round((100 - basePercentage * contributorCount) * 100) / 100;
          await tx.contribution.createMany({
            data: contributors.map((contributor, index) => ({
              costId: newCost.id,
              contributorId: contributor.id,
              percentage: new Decimal(
                index === 0 ? basePercentage + remainder : basePercentage
              ),
            })),
          });
        }
      }
    });
  }

  /**
   * Copy all costs from source month to target month, including each cost's
   * contributions (contributorId + percentage).
   */
  private async duplicateCostsAndContributionsFromMonth(
    sourceMonthId: string,
    targetMonthId: string
  ) {
    const costsWithContributions = await this.db.cost.findMany({
      where: { monthId: sourceMonthId },
      include: { contributions: true },
    });

    await this.db.$transaction(async (tx) => {
      for (const cost of costsWithContributions) {
        const newCost = await tx.cost.create({
          data: {
            monthId: targetMonthId,
            expenseId: cost.expenseId,
            amount: cost.amount,
            isActive: cost.isActive,
          },
        });
        if (cost.contributions.length > 0) {
          await tx.contribution.createMany({
            data: cost.contributions.map((c) => ({
              costId: newCost.id,
              contributorId: c.contributorId,
              percentage: c.percentage,
            })),
          });
        }
      }
    });
  }

  async delete(monthId: string) {
    return this.db.month.delete({
      where: { id: monthId },
    });
  }
}
