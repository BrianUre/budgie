import type { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { DEFAULT_PAYMENT_STATUS, paymentStatusSchema, type PaymentStatusType } from "@/types/payment-status";

export class CostService {
  constructor(private readonly db: PrismaClient) {}

  async getById(costId: string) {
    return this.db.cost.findUnique({
      where: { id: costId },
      include: { month: true },
    });
  }

  /**
   * Returns costs for a month with all relations included and Decimal fields
   * serialized to numbers so the result is directly usable by the client.
   */
  async listForMonth(monthId: string) {
    const costs = await this.db.cost.findMany({
      where: { monthId, expense: { archived: false } },
      include: {
        expense: true,
        contributions: true,
        destination: true,
        paymentStatus: true,
      },
    });
    return costs.map((cost) => ({
      ...cost,
      amount: cost.amount.toNumber(),
      contributions: cost.contributions.map((c) => ({
        ...c,
        percentage: c.percentage.toNumber(),
      })),
    }));
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

  async updateDestination(costId: string, destinationId: string | null) {
    return this.db.cost.update({
      where: { id: costId },
      data: { destinationId },
    });
  }

  async updatePaymentStatus(costId: string, status: PaymentStatusType) {
    const parsedStatus = paymentStatusSchema.parse(status);
    const existing = await this.db.paymentStatus.findUnique({
      where: { costId },
    });
    if (!existing) {
      throw new Error("Payment status doesn't exist");
    }
    return this.db.paymentStatus.update({
      where: { costId },
      data: { status: parsedStatus },
    });
  }

  async getOrCreate(monthId: string, expenseId: string, amount: number) {
    const existing = await this.db.cost.findUnique({
      where: {
        monthId_expenseId: { monthId, expenseId },
      },
    });
    if (existing) return existing;
    const cost = await this.db.cost.create({
      data: {
        monthId,
        expenseId,
        amount: new Decimal(amount),
        isActive: true,
      },
    });
    await this.db.paymentStatus.create({
      data: {
        costId: cost.id,
        status: DEFAULT_PAYMENT_STATUS,
      },
    });
    return cost;
  }

  /**
   * Add an existing expense as a cost to a month (creates cost + default contributions).
   * Idempotent: if cost already exists for this month/expense, returns it.
   */
  async createForMonth(
    monthId: string,
    expenseId: string,
    amount: number,
    budgieId: string,
    destinationId?: string | null
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
          ...(destinationId != null && destinationId !== "" ? { destinationId } : {}),
        },
      });
      await (tx as any).paymentStatus.create({
        data: {
          costId: cost.id,
          status: DEFAULT_PAYMENT_STATUS,
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
