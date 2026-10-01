"use client";

import { useMemo } from "react";
import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ExpensesBreakdownChart } from "@/components/expenses-breakdown-chart";
import { StatisticsRangeSelector } from "@/components/statistics-range-selector";
import { TotalExpensesChart } from "@/components/total-expenses-chart";
import { contributorDisplayName } from "@/lib/contributor";
import {
  buildBreakdownChartData,
  buildTotalChartRows,
  type BreakdownEntity,
} from "@/lib/statistics-chart-data";
import { cn } from "@/lib/utils";
import type { MonthlyBreakdownPoint } from "@/server/api/routers/statistics";
import type { CategoryListItem } from "@/server/api/routers/category";
import type { ContributorListItem } from "@/server/api/routers/contributor";
import type { DestinationListItem } from "@/server/api/routers/destination";
import type { Currency } from "@/types/currency";
import {
  UNASSIGNED_DESTINATION_ID,
  UNCATEGORIZED_ID,
  type StatisticsRange,
} from "@/types/statistics";

interface StatisticsViewProps {
  budgieId: string;
  points: MonthlyBreakdownPoint[];
  contributors: ContributorListItem[];
  destinations: DestinationListItem[];
  categories: CategoryListItem[];
  currency: Currency;
  range: StatisticsRange;
  onRangeChange: (range: StatisticsRange) => void;
  isLoading: boolean;
  /** True while a range change is in flight; the previous charts stay visible. */
  isRefetching: boolean;
}

function ChartCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-6 w-48 motion-reduce:animate-none" />
        <Skeleton className="mt-2 h-4 w-64 motion-reduce:animate-none" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[240px] w-full motion-reduce:animate-none" />
      </CardContent>
    </Card>
  );
}

export function StatisticsView({
  budgieId,
  points,
  contributors,
  destinations,
  categories,
  currency,
  range,
  onRangeChange,
  isLoading,
  isRefetching,
}: StatisticsViewProps) {
  const contributorEntities = useMemo<BreakdownEntity[]>(
    () =>
      contributors.map((contributor) => ({
        id: contributor.id,
        label: contributorDisplayName(contributor),
      })),
    [contributors]
  );

  const destinationEntities = useMemo<BreakdownEntity[]>(
    () => [
      ...destinations.map((destination) => ({
        id: destination.id,
        label: destination.name,
      })),
      { id: UNASSIGNED_DESTINATION_ID, label: "No destination" },
    ],
    [destinations]
  );

  // Categories already carry a color everywhere else in the app, so the chart
  // reuses it instead of taking a palette slot.
  const categoryEntities = useMemo<BreakdownEntity[]>(
    () => [
      ...categories.map((category) => ({
        id: category.id,
        label: category.name,
        color: { light: category.color, dark: category.color },
      })),
      { id: UNCATEGORIZED_ID, label: "Uncategorized" },
    ],
    [categories]
  );

  const totalRows = useMemo(() => buildTotalChartRows(points), [points]);

  const contributorData = useMemo(
    () =>
      buildBreakdownChartData({
        points,
        entities: contributorEntities,
        selectAmounts: (point) => point.byContributor,
      }),
    [points, contributorEntities]
  );

  const destinationData = useMemo(
    () =>
      buildBreakdownChartData({
        points,
        entities: destinationEntities,
        selectAmounts: (point) => point.byDestination,
      }),
    [points, destinationEntities]
  );

  const categoryData = useMemo(
    () =>
      buildBreakdownChartData({
        points,
        entities: categoryEntities,
        selectAmounts: (point) => point.byCategory,
      }),
    [points, categoryEntities]
  );

  return (
    <div className="space-y-4 pb-8">
      <div className="flex flex-wrap items-center gap-3">
        <StatisticsRangeSelector
          value={range}
          onValueChange={onRangeChange}
          disabled={isLoading}
        />
        <p className="text-sm text-muted-foreground">
          Active costs only, oldest month first.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-4">
          <ChartCardSkeleton />
          <ChartCardSkeleton />
          <ChartCardSkeleton />
          <ChartCardSkeleton />
        </div>
      )}

      {!isLoading && points.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <BarChart3 className="h-10 w-10 text-tertiary" aria-hidden="true" />
            <div className="space-y-1">
              <p className="font-medium">Nothing to chart yet</p>
              <p className="text-sm text-muted-foreground">
                Once this budgie has a month with some expenses, its spending
                history shows up here.
              </p>
            </div>
            <Link href={`/budgie/${budgieId}/payments`}>
              <Button variant="outline">Go to payments</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {!isLoading && points.length > 0 && (
        <div
          className={cn(
            "space-y-4 transition-opacity",
            isRefetching && "opacity-60"
          )}
        >
          <TotalExpensesChart rows={totalRows} currency={currency} />

          <ExpensesBreakdownChart
            title="Expenses per contributor"
            description="How much each contributor put in, month by month."
            data={contributorData}
            currency={currency}
            emptyMessage="No contributions recorded in this range."
          />

          <ExpensesBreakdownChart
            title="Expenses per destination"
            description="How much went to each destination, month by month."
            data={destinationData}
            currency={currency}
            emptyMessage="No expenses recorded in this range."
          />

          <ExpensesBreakdownChart
            title="Expenses per category"
            description="How much each category cost, month by month. A cost counts in full towards every category it carries."
            data={categoryData}
            currency={currency}
            emptyMessage="No expenses recorded in this range."
          />
        </div>
      )}
    </div>
  );
}
