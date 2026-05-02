import { DEFAULT_PAYMENT_STATUS } from "@/types/payment-status";
import type { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { randomUUID } from "node:crypto";

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

  /**
   * Ensures a month row exists for the current UTC calendar month.
   * If created, copies costs from the latest existing month when one exists.
   */
  async ensureCurrentMonthForBudgie(budgieId: string) {
    const currentStart = firstDayOfMonth(new Date());
    const existing = await this.getByBudgieAndDate(budgieId, currentStart);
    if (existing) return existing;

    const months = await this.listForBudgie(budgieId);
    const newMonth = await this.db.month.create({
      data: { budgieId, date: currentStart },
    });
    if (months.length > 0) {
      await this.duplicateCostsAndContributionsFromMonth(
        months[0]!.id,
        newMonth.id
      );
    }
    return newMonth;
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
   * Copies contribution amounts from the latest month's cost per expense when available.
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

    const costsData = costOverrides.map((override) => ({
      id: randomUUID(),
      monthId: targetMonthId,
      expenseId: override.expenseId,
      amount: new Decimal(override.amount),
      isActive: override.isActive,
    }));

    const paymentStatusesData = costsData.map((cost) => ({
      costId: cost.id,
      status: DEFAULT_PAYMENT_STATUS,
    }));

    const contributionsData = costsData.flatMap((cost, index) => {
      const override = costOverrides[index]!;
      const sourceCost = sourceCosts.find(
        (source) => source.expenseId === override.expenseId
      );
      if (sourceCost?.contributions.length) {
        return sourceCost.contributions.map((contribution) => ({
          costId: cost.id,
          contributorId: contribution.contributorId,
          amount: contribution.amount,
        }));
      }
      return contributors.map((contributor) => ({
        costId: cost.id,
        contributorId: contributor.id,
        amount: new Decimal(0),
      }));
    });

    await this.db.$transaction([
      this.db.cost.createMany({ data: costsData }),
      this.db.paymentStatus.createMany({ data: paymentStatusesData }),
      ...(contributionsData.length > 0
        ? [this.db.contribution.createMany({ data: contributionsData })]
        : []),
    ]);
  }

  /**
   * Copy all costs from source month to target month, including each cost's
   * contributions (contributorId + amount).
   */
  private async duplicateCostsAndContributionsFromMonth(
    sourceMonthId: string,
    targetMonthId: string
  ) {
    const costsWithContributions = await this.db.cost.findMany({
      where: { monthId: sourceMonthId },
      include: { contributions: true },
    });

    const costsData = costsWithContributions.map((cost) => ({
      id: randomUUID(),
      monthId: targetMonthId,
      expenseId: cost.expenseId,
      amount: cost.amount,
      isActive: cost.isActive,
    }));

    const paymentStatusesData = costsData.map((cost) => ({
      costId: cost.id,
      status: DEFAULT_PAYMENT_STATUS,
    }));

    const contributionsData = costsData.flatMap((cost, index) =>
      costsWithContributions[index]!.contributions.map((contribution) => ({
        costId: cost.id,
        contributorId: contribution.contributorId,
        amount: contribution.amount,
      }))
    );

    await this.db.$transaction([
      this.db.cost.createMany({ data: costsData }),
      this.db.paymentStatus.createMany({ data: paymentStatusesData }),
      ...(contributionsData.length > 0
        ? [this.db.contribution.createMany({ data: contributionsData })]
        : []),
    ]);
  }

  async delete(monthId: string) {
    return this.db.month.delete({
      where: { id: monthId },
    });
  }
}
