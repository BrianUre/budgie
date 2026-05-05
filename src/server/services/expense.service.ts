import { DEFAULT_PAYMENT_STATUS } from "@/types/payment-status";
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

  /**
   * Removes or archives an expense depending on whether it has costs in months
   * other than `currentMonthId`. Expenses used only in the current month (or
   * in no months at all) are hard-deleted; those with history in other months
   * are soft-archived so historical data is preserved.
   */
  async archive(expenseId: string, currentMonthId: string) {
    const expense = await this.db.expense.findUnique({
      where: { id: expenseId },
      include: { costs: true },
    });
    if (!expense) return;

    const costsInOtherMonths = expense.costs.filter(
      (cost) => cost.monthId !== currentMonthId
    );

    if (costsInOtherMonths.length > 0) {
      await this.db.expense.update({
        where: { id: expenseId },
        data: { archived: true, archivedOn: firstDayOfMonth(new Date()) },
      });
    } else {
      await this.db.expense.delete({ where: { id: expenseId } });
    }
  }

  async create(
    data: {
      budgieId: string;
      name: string;
      initialAmount: number;
      destinationId?: string | null;
      categoryIds?: string[];
    },
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
          ...(data.destinationId != null && data.destinationId !== ""
            ? { destinationId: data.destinationId }
            : {}),
        },
      });

      await (tx as any).paymentStatus.create({
        data: {
          costId: cost.id,
          status: DEFAULT_PAYMENT_STATUS,
        },
      });

      const contributors = await tx.contributor.findMany({
        where: { budgieId: data.budgieId },
      });

      if (contributors.length === 0) {
        throw new Error("No contributors found");
      }
      await tx.contribution.createMany({
        data: contributors.map((contributor) => ({
          costId: cost.id,
          contributorId: contributor.id,
          amount: new Decimal(0),
        })),
      });

      const categoryIds = Array.from(new Set(data.categoryIds ?? []));
      if (categoryIds.length > 0) {
        await tx.costCategory.createMany({
          data: categoryIds.map((categoryId) => ({
            costId: cost.id,
            categoryId,
          })),
        });
      }

      return expense;
    });
  }
}
