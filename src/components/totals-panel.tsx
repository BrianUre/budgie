"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatMoney } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type TotalsPanelCost = {
  id: string;
  amount: unknown;
  destinationId?: string | null;
  destination?: { id: string; name: string } | null;
  contributions: Array<{ contributorId: string; percentage: unknown }>;
};

export type TotalsPanelContributor = {
  id: string;
  name: string | null;
  user?: { name?: string | null; email?: string | null } | null;
};

export type Destination = {
  id: string;
  name: string;
};

interface TotalsPanelProps {
  contributors: TotalsPanelContributor[];
  costs: TotalsPanelCost[];
  destinations: Destination[];
  className?: string;
}

function contributorDisplayName(c: TotalsPanelContributor): string {
  return c.user?.name ?? c.user?.email ?? c.name ?? "—";
}

export function TotalsPanel({
  contributors,
  costs,
  destinations,
  className,
}: TotalsPanelProps) {
  const totalCostAmount = useMemo(
    () => costs.reduce((sum, cost) => sum + Number(cost.amount), 0),
    [costs]
  );

  const totalByDestination = useMemo(() => {
    const map = new Map<string | null, number>();
    for (const cost of costs) {
      const key = cost.destinationId ?? cost.destination?.id ?? null;
      const current = map.get(key) ?? 0;
      map.set(key, current + Number(cost.amount));
    }
    return map;
  }, [costs]);

  const totalByContributor = useMemo(() => {
    const map = new Map<string, number>();
    for (const contributor of contributors) {
      let total = 0;
      for (const cost of costs) {
        const contribution = cost.contributions?.find(
          (c) => c.contributorId === contributor.id
        );
        if (contribution) {
          total +=
            Number(cost.amount) * (Number(contribution.percentage) / 100);
        }
      }
      map.set(contributor.id, total);
    }
    return map;
  }, [contributors, costs]);

  const totalByContributorByDestination = useMemo(() => {
    const outer = new Map<string, Map<string | null, number>>();
    for (const contributor of contributors) {
      const inner = new Map<string | null, number>();
      for (const cost of costs) {
        const contribution = cost.contributions?.find(
          (c) => c.contributorId === contributor.id
        );
        if (!contribution) continue;
        const destKey = cost.destinationId ?? cost.destination?.id ?? null;
        const amount =
          Number(cost.amount) * (Number(contribution.percentage) / 100);
        inner.set(destKey, (inner.get(destKey) ?? 0) + amount);
      }
      outer.set(contributor.id, inner);
    }
    return outer;
  }, [contributors, costs]);

  const hasNoDestination = totalByDestination.has(null);
  const destinationEntries = [
    ...destinations.map((d) => ({ key: d.id as string | null, label: d.name })),
    ...(hasNoDestination ? [{ key: null as string | null, label: "No destination" }] : []),
  ];

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-sm font-medium text-muted-foreground">Totals</h3>

      <div className="flex flex-col gap-4">
        {/* First item: global total + per destination */}
        <Card className="w-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Total</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xl font-semibold">
              {formatMoney(totalCostAmount)}
            </p>
            {destinationEntries.length > 0 && (
              <ul className="space-y-1.5 border-t pt-3 text-sm">
                {destinationEntries.map(({ key, label }) => (
                  <li
                    key={key ?? "__none__"}
                    className="flex justify-between gap-2"
                  >
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-mono">
                      {formatMoney(totalByDestination.get(key ?? null) ?? 0)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* One item per contributor: contributor total + per destination */}
        {contributors.map((contributor) => (
          <Card key={contributor.id} className="w-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {contributorDisplayName(contributor)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xl font-semibold">
                {formatMoney(totalByContributor.get(contributor.id) ?? 0)}
              </p>
              {destinationEntries.length > 0 && (
                <ul className="space-y-1.5 border-t pt-3 text-sm">
                  {destinationEntries.map(({ key, label }) => (
                    <li
                      key={key ?? "__none__"}
                      className="flex justify-between gap-2"
                    >
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-mono">
                        {formatMoney(
                          totalByContributorByDestination
                            .get(contributor.id)
                            ?.get(key ?? null) ?? 0
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
