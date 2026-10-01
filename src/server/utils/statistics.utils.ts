import {
  UNASSIGNED_DESTINATION_ID,
  UNCATEGORIZED_ID,
} from "@/types/statistics";

type AmountLike = { toNumber(): number };

export type AggregatableMonth = {
  id: string;
  date: Date;
};

export type AggregatableCost = {
  monthId: string;
  amount: AmountLike;
  destinationId: string | null;
  contributions: { contributorId: string; amount: AmountLike }[];
  costCategories: { categoryId: string }[];
};

export type MonthlyStatisticsPoint = {
  monthId: string;
  date: Date;
  total: number;
  byContributor: Record<string, number>;
  byDestination: Record<string, number>;
  byCategory: Record<string, number>;
};

function addAmount(
  totals: Record<string, number>,
  key: string,
  amount: number
): void {
  totals[key] = (totals[key] ?? 0) + amount;
}

/**
 * Collapses costs into one data point per month, oldest first.
 *
 * Destination totals sum to the month total because a cost has at most one
 * destination. Category totals do not: a cost credits its full amount to every
 * category it carries, so categories are meant to be compared against each
 * other, never stacked into a whole.
 */
export function aggregateMonthlyStatistics({
  months,
  costs,
}: {
  months: AggregatableMonth[];
  costs: AggregatableCost[];
}): MonthlyStatisticsPoint[] {
  const pointsByMonthId = new Map<string, MonthlyStatisticsPoint>();

  for (const month of months) {
    pointsByMonthId.set(month.id, {
      monthId: month.id,
      date: month.date,
      total: 0,
      byContributor: {},
      byDestination: {},
      byCategory: {},
    });
  }

  for (const cost of costs) {
    const point = pointsByMonthId.get(cost.monthId);
    if (!point) {
      continue;
    }

    const amount = cost.amount.toNumber();
    point.total += amount;
    addAmount(
      point.byDestination,
      cost.destinationId ?? UNASSIGNED_DESTINATION_ID,
      amount
    );

    for (const contribution of cost.contributions) {
      addAmount(
        point.byContributor,
        contribution.contributorId,
        contribution.amount.toNumber()
      );
    }

    if (cost.costCategories.length === 0) {
      addAmount(point.byCategory, UNCATEGORIZED_ID, amount);
      continue;
    }

    for (const costCategory of cost.costCategories) {
      addAmount(point.byCategory, costCategory.categoryId, amount);
    }
  }

  return Array.from(pointsByMonthId.values()).sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );
}
