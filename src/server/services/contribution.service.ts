import type { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export class ContributionService {
  constructor(private readonly db: PrismaClient) {}

  async listForCost(costId: string) {
    return this.db.contribution.findMany({
      where: { costId },
      include: {
        contributor: { include: { user: true } },
      },
    });
  }

  async listForMonth(monthId: string) {
    const contributions = await this.db.contribution.findMany({
      where: { cost: { monthId } },
      include: {
        cost: { include: { expense: true } },
        contributor: { include: { user: true } },
      },
    });
    return contributions.map((c) => ({
      ...c,
      amount: c.amount.toNumber(),
    }));
  }

  async setAmount(contributionId: string, amount: number) {
    if (Number.isNaN(amount) || amount < 0) {
      throw new Error("Amount must be a valid non-negative number");
    }
    return this.db.contribution.update({
      where: { id: contributionId },
      data: { amount: new Decimal(amount) },
    });
  }

  async upsertAmount(costId: string, contributorId: string, amount: number) {
    if (Number.isNaN(amount) || amount < 0) {
      throw new Error("Amount must be a valid non-negative number");
    }
    return this.db.contribution.upsert({
      where: { costId_contributorId: { costId, contributorId } },
      update: { amount: new Decimal(amount) },
      create: { costId, contributorId, amount: new Decimal(amount) },
    });
  }
}

export type ContributionsForMonth = Awaited<
  ReturnType<ContributionService["listForMonth"]>
>;
