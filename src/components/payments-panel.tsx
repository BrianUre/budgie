"use client";

import { useMemo } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Separator } from "@/components/ui/separator";
import { formatMoney } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { CreditCard } from "lucide-react";
import { PaymentStatusSection } from "@/components/payment-status-section";
import type { PaymentStatusType } from "@/types/payment-status";

export type PaymentsPanelCost = {
  id: string;
  amount: unknown;
  destinationId?: string | null;
  destination?: { id: string; name: string } | null;
  contributions: Array<{ contributorId: string; percentage: unknown }>;
  expense?: { id: string; name: string } | null;
  paymentStatus?: { id: string; status: PaymentStatusType } | null;
};

export type PaymentsPanelContributor = {
  id: string;
  name: string | null;
  userId?: string | null;
  user?: {
    name?: string | null;
    email?: string | null;
    imageUrl?: string | null;
  } | null;
};

export type PaymentsPanelDestination = {
  id: string;
  name: string;
  iban?: string | null;
};

interface PaymentsPanelProps {
  contributors: PaymentsPanelContributor[];
  costs: PaymentsPanelCost[];
  destinations: PaymentsPanelDestination[];
  currentUserId?: string | null;
  budgieId: string;
  monthId: string;
  isAdmin: boolean;
  className?: string;
}

function contributorDisplayName(contributor: PaymentsPanelContributor): string {
  return contributor.user?.name ?? contributor.user?.email ?? contributor.name ?? "—";
}

function contributorInitials(contributor: PaymentsPanelContributor): string {
  const name = contributorDisplayName(contributor);
  if (name === "—") return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0]![0] + parts[parts.length - 1]![0]).toUpperCase().slice(0, 2);
  }
  return name.slice(0, 2).toUpperCase();
}

export function PaymentsPanel({
  contributors,
  costs,
  destinations,
  currentUserId,
  budgieId,
  monthId,
  isAdmin,
  className,
}: PaymentsPanelProps) {
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
          (contrib) => contrib.contributorId === contributor.id
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
          (contrib) => contrib.contributorId === contributor.id
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
  const destinationRows = useMemo(() => {
    const rows: Array<{
      id: string | null;
      name: string;
      iban: string | null;
    }> = destinations.map((destination) => ({
      id: destination.id,
      name: destination.name,
      iban: destination.iban?.trim() || null,
    }));
    if (hasNoDestination) {
      rows.push({
        id: null,
        name: "No destination",
        iban: null,
      });
    }
    return rows;
  }, [destinations, hasNoDestination]);

  const costsWithStatus: Array<
    PaymentsPanelCost & { paymentStatusValue: PaymentStatusType; expenseName: string }
  > = useMemo(
    () =>
      costs.map((cost) => {
        const status =
          cost.paymentStatus?.status ??
          ("pending" as PaymentStatusType);
        const expenseName = cost.expense?.name ?? "—";
        return {
          ...cost,
          paymentStatusValue: status,
          expenseName,
        };
      }),
    [costs]
  );

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2">
        <CreditCard
          className="h-6 w-6 text-tertiary"
        />
      <h3 className="text-base sm:text-2xl font-zain font-medium">Payments</h3>
      </div>

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
            {destinationRows.length > 0 && (
              <ul className="space-y-1.5 border-t pt-3 text-sm">
                {destinationRows
                  .filter((row): row is typeof row & { id: string } => row.id !== null)
                  .map(({ id, name, iban }) => (
                    <li
                      key={id}
                      className="flex justify-between gap-2"
                    >
                      {iban ? (
                        <HoverCard openDelay={200} closeDelay={100}>
                          <HoverCardTrigger asChild>
                            <span className="text-muted-foreground cursor-help underline decoration-dotted underline-offset-2">
                              {name}
                            </span>
                          </HoverCardTrigger>
                          <HoverCardContent
                            side="top"
                            align="start"
                            className="w-auto max-w-sm"
                          >
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground">
                                IBAN
                              </p>
                              <p className="font-mono text-sm">{iban}</p>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      ) : (
                        <span className="text-muted-foreground">{name}</span>
                      )}
                      <span className="font-mono">
                        {formatMoney(totalByDestination.get(id) ?? 0)}
                      </span>
                    </li>
                  ))}
                {hasNoDestination && (
                  <>
                    <li className="list-none py-0 my-1.5">
                      <Separator />
                    </li>
                    <li className="flex justify-between gap-2 text-red-500">
                      <span>No destination</span>
                      <span className="font-mono">
                        {formatMoney(totalByDestination.get(null) ?? 0)}
                      </span>
                    </li>
                  </>
                )}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* One item per contributor: narrow vertical cards in a grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {contributors.map((contributor) => (
            <Card
              key={contributor.id}
              className={cn(
                "w-full flex flex-col",
                currentUserId &&
                  contributor.userId === currentUserId &&
                  "ring-2 ring-primary"
              )}
            >
              <CardHeader className="pb-2 flex flex-col items-center text-center">
                <div className="mb-2 flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                  {contributor.user?.imageUrl ? (
                    <Image
                      src={contributor.user.imageUrl}
                      alt=""
                      width={64}
                      height={64}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-medium text-muted-foreground">
                      {contributorInitials(contributor)}
                    </span>
                  )}
                </div>
                <CardTitle className="text-base">
                  {contributorDisplayName(contributor)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 flex-1">
                <p className="text-xl font-semibold text-center">
                  {formatMoney(totalByContributor.get(contributor.id) ?? 0)}
                </p>
                {destinationRows.length > 0 && (
                  <ul className="space-y-1.5 border-t pt-3 text-sm">
                    {destinationRows
                      .filter((row): row is typeof row & { id: string } => row.id !== null)
                      .map(({ id, name, iban }) => (
                        <li
                          key={id}
                          className="flex justify-between gap-2"
                        >
                          {iban ? (
                            <HoverCard openDelay={200} closeDelay={100}>
                              <HoverCardTrigger asChild>
                                <span className="text-muted-foreground truncate cursor-help underline decoration-dotted underline-offset-2">
                                  {name}
                                </span>
                              </HoverCardTrigger>
                              <HoverCardContent
                                side="top"
                                align="start"
                                className="w-auto max-w-sm"
                              >
                                <div className="space-y-1">
                                  <p className="text-xs font-medium text-muted-foreground">
                                    IBAN
                                  </p>
                                  <p className="font-mono text-sm">{iban}</p>
                                </div>
                              </HoverCardContent>
                            </HoverCard>
                          ) : (
                            <span className="text-muted-foreground truncate">
                              {name}
                            </span>
                          )}
                          <span className="font-mono shrink-0">
                            {formatMoney(
                              totalByContributorByDestination
                                .get(contributor.id)
                                ?.get(id) ?? 0
                            )}
                          </span>
                        </li>
                      ))}
                    {hasNoDestination && (
                      <>
                        <li className="list-none py-0 my-1.5">
                          <Separator />
                        </li>
                        <li className="flex justify-between gap-2 text-red-500">
                          <span className="truncate">No destination</span>
                          <span className="font-mono shrink-0">
                            {formatMoney(
                              totalByContributorByDestination
                                .get(contributor.id)
                                ?.get(null) ?? 0
                            )}
                          </span>
                        </li>
                      </>
                    )}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <PaymentStatusSection
          costsWithStatus={costsWithStatus}
          isAdmin={isAdmin}
          budgieId={budgieId}
          monthId={monthId}
        />
      </div>
    </div>
  );
}
