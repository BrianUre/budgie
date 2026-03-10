"use client";

import { api } from "@/lib/trpc/client";
import { ExpensesView } from "@/components/expenses-view";
import { useBudgieDetail } from "../budgie-detail-context";

export default function ExpensesTabPage() {
  const {
    budgieId,
    selectedMonthId,
    isAdmin,
    contributorsWithSessionFirst,
    userId,
  } = useBudgieDetail();

  const { data: costsForMonth = [] } = api.cost.listForMonth.useQuery(
    { monthId: selectedMonthId!, budgieId },
    { enabled: !!selectedMonthId }
  );

  return (
    <ExpensesView
      budgieId={budgieId}
      selectedMonthId={selectedMonthId}
      isAdmin={isAdmin}
      contributors={contributorsWithSessionFirst}
      currentUserId={userId}
      costsForMonth={costsForMonth}
    />
  );
}
