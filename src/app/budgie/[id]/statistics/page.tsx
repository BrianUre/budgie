"use client";

import { useState } from "react";
import { api } from "@/lib/trpc/client";
import { StatisticsView } from "@/components/statistics-view";
import {
  DEFAULT_STATISTICS_RANGE,
  monthCountForRange,
  type StatisticsRange,
} from "@/types/statistics";
import { useBudgieDetail } from "../budgie-detail-context";

export default function StatisticsTabPage() {
  const { budgieId, currency, contributors, destinations, categories } =
    useBudgieDetail();
  const [range, setRange] = useState<StatisticsRange>(DEFAULT_STATISTICS_RANGE);

  const {
    data: points = [],
    isPending,
    isFetching,
  } = api.statistics.monthlyBreakdown.useQuery(
    { budgieId, monthCount: monthCountForRange(range) },
    {
      enabled: !!budgieId,
      // Keep the previous range on screen while the new one loads, so the
      // charts never collapse back to skeletons mid-interaction.
      placeholderData: (previousData) => previousData,
    }
  );

  return (
    <StatisticsView
      budgieId={budgieId}
      points={points}
      contributors={contributors}
      destinations={destinations}
      categories={categories}
      currency={currency}
      range={range}
      onRangeChange={setRange}
      isLoading={isPending}
      isRefetching={isFetching && !isPending}
    />
  );
}
