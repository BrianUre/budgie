import type { PrismaClient } from "@prisma/client";

function firstDayOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
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
}
