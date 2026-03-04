"use client";

import { useMemo } from "react";
import { api } from "@/lib/trpc/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn, formatMoney } from "@/lib/utils";

export function ContributorBalance({
  budgieId,
  monthId,
  contributors,
  className,
}: {
  budgieId: string;
  monthId: string | null;
  contributors: Array<{
    id: string;
    name: string | null;
    user?: { email: string } | null;
  }>;
  className?: string;
}) {
  const { data: costs = [] } = api.cost.listForMonth.useQuery(
    { monthId: monthId!, budgieId },
    { enabled: !!monthId }
  );
  const { data: contributionsForMonth = [] } =
    api.contribution.listForMonth.useQuery(
      { monthId: monthId! },
      { enabled: !!monthId }
    );

  const contributionsByCost = useMemo(() => {
    const map = new Map<string, typeof contributionsForMonth>();
    for (const contribution of contributionsForMonth) {
      const list = map.get(contribution.costId) ?? [];
      list.push(contribution);
      map.set(contribution.costId, list);
    }
    return map;
  }, [contributionsForMonth]);

  const totalCostAmount = useMemo(() => {
    return costs.reduce((sum, cost) => sum + Number(cost.amount), 0);
  }, [costs]);

  const totalByContributor = useMemo(() => {
    const map = new Map<string, number>();
    for (const contributor of contributors) {
      let total = 0;
      for (const cost of costs) {
        const costContributions = contributionsByCost.get(cost.id) ?? [];
        const contribution = costContributions.find(
          (costContribution) =>
            costContribution.contributorId === contributor.id
        );
        if (contribution) {
          total +=
            Number(cost.amount) * (Number(contribution.percentage) / 100);
        }
      }
      map.set(contributor.id, total);
    }
    return map;
  }, [contributors, costs, contributionsByCost]);

  if (!monthId) {
    return (
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle>Totals</CardTitle>
          <CardDescription>
            Total costs and each contributor&apos;s share for the selected
            month.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Select a month to see totals.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Totals</CardTitle>
        <CardDescription>
          Total costs and each contributor&apos;s share for the selected month.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="font-medium">
            Total costs: {formatMoney(totalCostAmount)}
          </p>
          {contributors.map((contributor) => (
            <p
              key={contributor.id}
              className="text-muted-foreground text-sm"
            >
              {contributor.user?.email ?? contributor.name}:{" "}
              {formatMoney(totalByContributor.get(contributor.id) ?? 0)}
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
