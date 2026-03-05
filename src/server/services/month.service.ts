import type { PrismaClient } from "@prisma/client";

function firstDayOfMonth(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)
  );
}

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

  async createNextForBudgie(budgieId: string) {
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

    if (months.length > 0) {
      const sourceMonthId = months[0]!.id;
      await this.duplicateCostsAndContributionsFromMonth(
        sourceMonthId,
        newMonth.id
      );
    }

    return newMonth;
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
