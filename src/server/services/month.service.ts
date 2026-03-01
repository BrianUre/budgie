import type { PrismaClient } from "@prisma/client";

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
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });
  }

  async getOrCreateForBudgie(budgieId: string, year: number, month: number) {
    const existing = await this.db.month.findUnique({
      where: {
        budgieId_year_month: { budgieId, year, month },
      },
    });
    if (existing) return existing;
    return this.db.month.create({
      data: { budgieId, year, month },
    });
  }

  async getByBudgieAndYearMonth(budgieId: string, year: number, month: number) {
    return this.db.month.findUnique({
      where: {
        budgieId_year_month: { budgieId, year, month },
      },
    });
  }
}
