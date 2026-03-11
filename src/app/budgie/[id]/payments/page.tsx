"use client";

import { useMemo } from "react";
import { api } from "@/lib/trpc/client";
import { PaymentsPanel } from "@/components/payments-panel";
import { useBudgieDetail } from "../budgie-detail-context";

export default function PaymentsTabPage() {
  const {
    budgieId,
    selectedMonthId,
    contributorsWithSessionFirst,
    destinations,
    userId,
  } = useBudgieDetail();

  const { data: costsForMonth = [] } = api.cost.listForMonth.useQuery(
    { monthId: selectedMonthId!, budgieId },
    { enabled: !!selectedMonthId }
  );

  const activeCosts = useMemo(
    () => costsForMonth.filter((cost) => cost.isActive),
    [costsForMonth]
  );

  if (contributorsWithSessionFirst.length === 0) {
    return null;
  }

  return (
    <PaymentsPanel
      contributors={contributorsWithSessionFirst}
      costs={activeCosts}
      destinations={destinations.map((destination) => ({
        id: destination.id,
        name: destination.name ?? "",
        iban: destination.iban ?? null,
      }))}
      currentUserId={userId}
    />
  );
}
