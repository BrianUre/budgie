import type { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export class ExpenseService {
  constructor(private readonly db: PrismaClient) {}

  async listForBudgie(budgieId: string) {
    return this.db.expense.findMany({
      where: { budgieId },
      orderBy: { name: "asc" },
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
      await tx.cost.create({
        data: {
          monthId,
          expenseId: expense.id,
          amount: new Decimal(data.initialAmount),
        },
      });
      return expense;
    });
  }
}
