import type { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * Input for one contribution: contributorId and percentage.
 * All percentages for a cost must sum to 100.
 */
export type ContributionInput = {
  contributorId: string;
  percentage: number;
};

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
    return this.db.contribution.findMany({
      where: { cost: { monthId } },
      include: {
        cost: { include: { expense: true } },
        contributor: { include: { user: true } },
      },
    });
  }

  /**
   * Set all contributions for a cost. Replaces existing rows.
   * Enforces: sum(percentages) === 100.
   */
  async setPercentages(costId: string, contributions: ContributionInput[]) {
    const percentageSum = contributions.reduce((sum, contrib) => sum + contrib.percentage, 0);
    if (Math.abs(percentageSum - 100) > 0.01) {
      throw new Error(
        `Percentages must sum to 100, got ${percentageSum}`
      );
    }

    return this.db.$transaction(async (tx) => {
      await tx.contribution.deleteMany({ where: { costId } });
      if (contributions.length === 0) return [];
      const created = await tx.contribution.createManyAndReturn({
        data: contributions.map((contrib) => ({
          costId,
          contributorId: contrib.contributorId,
          percentage: new Decimal(contrib.percentage),
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
    if (Number.isNaN(percentage) || percentage < 0 || percentage > 100) {
      throw new Error("Percentage must be a valid number between 0 and 100");
    }
    return this.db.$transaction(async (tx) => {
      const contributions = await tx.contribution.findMany({
        where: { costId },
        orderBy: { id: "asc" },
      });
      const targetContribution = contributions.find((contrib) => contrib.id === contributionId);
      if (!targetContribution) {
        throw new Error("Contribution not found");
      }
      const siblingContributions = contributions.filter((contrib) => contrib.id !== contributionId);
      const siblingPercentageSum = siblingContributions.reduce(
        (sum, contrib) => sum + Number(contrib.percentage),
        0
      );

      await tx.contribution.update({
        where: { id: contributionId },
        data: { percentage: new Decimal(percentage) },
      });

      const remainingPercentage = 100 - percentage;
      if (siblingContributions.length > 0) {
        if (siblingPercentageSum > 0) {
          const scale = remainingPercentage / siblingPercentageSum;
          for (const sibling of siblingContributions) {
            const rebalancedPercentage = Number(sibling.percentage) * scale;
            await tx.contribution.update({
              where: { id: sibling.id },
              data: { percentage: new Decimal(rebalancedPercentage) },
            });
          }
        } else {
          const equalShare = remainingPercentage / siblingContributions.length;
          for (const sibling of siblingContributions) {
            await tx.contribution.update({
              where: { id: sibling.id },
              data: { percentage: new Decimal(equalShare) },
            });
          }
        }
      }
      return tx.contribution.findMany({ where: { costId } });
    });
  }
}

export type ContributionsForMonth = Awaited<
  ReturnType<ContributionService["listForMonth"]>
>;
