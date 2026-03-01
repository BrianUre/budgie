import type { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * Input for one contribution: either userId (user) or contributorId (Contributor table), and percentage.
 * All percentages for a cost must sum to 100.
 */
export type ContributionInput = {
  userId?: string;
  contributorId?: string;
  percentage: number;
};

export class ContributionService {
  constructor(private readonly db: PrismaClient) {}

  async listForCost(costId: string) {
    return this.db.contribution.findMany({
      where: { costId },
      include: {
        user: true,
        contributor: true,
      },
    });
  }

  async listForMonth(monthId: string) {
    return this.db.contribution.findMany({
      where: { cost: { monthId } },
      include: {
        cost: true,
        user: true,
        contributor: true,
      },
    });
  }

  /**
   * Set all contributions for a cost. Replaces existing rows.
   * Enforces: sum(percentages) === 100. Exactly one of userId or contributorId per row.
   */
  async setPercentages(costId: string, contributions: ContributionInput[]) {
    const sum = contributions.reduce((s, c) => s + c.percentage, 0);
    if (Math.abs(sum - 100) > 0.01) {
      throw new Error(
        `Percentages must sum to 100, got ${sum}`
      );
    }
    for (const c of contributions) {
      const hasUser = !!c.userId;
      const hasContributor = !!c.contributorId;
      if (hasUser === hasContributor) {
        throw new Error(
          "Each contribution must have exactly one of userId or contributorId"
        );
      }
    }

    return this.db.$transaction(async (tx) => {
      await tx.contribution.deleteMany({ where: { costId } });
      if (contributions.length === 0) return [];
      const created = await tx.contribution.createManyAndReturn({
        data: contributions.map((c) => ({
          costId,
          userId: c.userId ?? null,
          contributorId: c.contributorId ?? null,
          percentage: new Decimal(c.percentage),
        })),
      });
      return created;
    });
  }

  /**
   * Update one contribution's percentage and rebalance others so total remains 100%.
   * Rule: scale all other contributions proportionally so the new total is 100%.
   */
  async setPercentage(
    costId: string,
    contributionId: string,
    percentage: number
  ) {
    if (percentage < 0 || percentage > 100) {
      throw new Error("Percentage must be between 0 and 100");
    }
    return this.db.$transaction(async (tx) => {
      const all = await tx.contribution.findMany({
        where: { costId },
        orderBy: { id: "asc" },
      });
      const current = all.find((c) => c.id === contributionId);
      if (!current) {
        throw new Error("Contribution not found");
      }
      const others = all.filter((c) => c.id !== contributionId);
      const othersSum = others.reduce(
        (s, c) => s + Number(c.percentage),
        0
      );
      const newTotal = percentage + othersSum;
      if (newTotal < 0.01) {
        throw new Error("Cannot set percentage: would leave no room for others");
      }
      const scale = (100 - percentage) / othersSum;
      await tx.contribution.update({
        where: { id: contributionId },
        data: { percentage: new Decimal(percentage) },
      });
      for (const o of others) {
        const newPct = Number(o.percentage) * scale;
        await tx.contribution.update({
          where: { id: o.id },
          data: { percentage: new Decimal(newPct) },
        });
      }
      return tx.contribution.findMany({ where: { costId } });
    });
  }
}
