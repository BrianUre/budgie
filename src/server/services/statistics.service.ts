import type { PrismaClient } from "@prisma/client";
import {
  aggregateMonthlyStatistics,
  type MonthlyStatisticsPoint,
} from "@/server/utils/statistics.utils";

export class StatisticsService {
  constructor(private readonly db: PrismaClient) {}

  /**
   * Monthly totals with per-contributor, per-destination and per-category
   * breakdowns, oldest month first.
   *
   * Only active costs count, matching what the Payments and Expenses views
   * show. Costs belonging to archived expenses are kept: archiving an expense
   * should not rewrite the history of the months it was part of.
   */
  async monthlyBreakdown(
    budgieId: string,
    monthCount: number | null
  ): Promise<MonthlyStatisticsPoint[]> {
    const months = await this.db.month.findMany({
      where: { budgieId },
      orderBy: { date: "desc" },
      take: monthCount ?? undefined,
      select: { id: true, date: true },
    });
    if (months.length === 0) {
      return [];
    }

    const costs = await this.db.cost.findMany({
      where: {
        monthId: { in: months.map((month) => month.id) },
        isActive: true,
      },
      select: {
        monthId: true,
        amount: true,
        destinationId: true,
        contributions: { select: { contributorId: true, amount: true } },
        costCategories: { select: { categoryId: true } },
      },
    });

    return aggregateMonthlyStatistics({ months, costs });
  }
}
