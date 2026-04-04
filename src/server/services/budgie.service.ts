import type { PrismaClient } from "@prisma/client";
import {
  currentUtcMonthStart,
  summarizeDashboardCosts,
} from "../utils/budgie.utils";

export class BudgieService {
  constructor(private readonly db: PrismaClient) {}

  async listDashboardForUser(userId: string) {
    const monthStart = currentUtcMonthStart();
    const rows = await this.db.budgie.findMany({
      where: {
        contributors: { some: { userId } },
      },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        _count: { select: { contributors: true } },
        contributors: {
          where: { userId },
          select: { isAdmin: true },
          take: 1,
        },
        months: {
          where: { date: monthStart },
          take: 1,
          select: {
            costs: {
              where: {
                isActive: true,
                expense: { archived: false },
              },
              select: {
                amount: true,
                paymentStatus: { select: { status: true } },
              },
            },
          },
        },
      },
    });

    return rows.map((b) => {
      const costs = b.months[0]?.costs ?? [];
      const { currentMonthExpenseTotal, currentMonthPaidPercent } =
        summarizeDashboardCosts(costs);
      const isAdmin = b.contributors[0]?.isAdmin ?? false;
      return {
        id: b.id,
        name: b.name,
        contributorCount: b._count.contributors,
        hasCurrentMonth: b.months.length > 0,
        isAdmin,
        currentMonthExpenseTotal,
        currentMonthPaidPercent,
      };
    });
  }

  async listForUser(userId: string) {
    return this.db.budgie.findMany({
      where: {
        contributors: { some: { userId } },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  async create(data: { name: string }, userId: string) {
    const now = new Date();
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
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
