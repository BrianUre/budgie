"use client";

import { MonthSelector } from "@/components/month-selector";
import { Separator } from "@/components/ui/separator";
import { useBudgieDetail } from "../budgie-detail-context";

/**
 * Layout for budgie pages scoped to a single month. The month selector lives
 * here (rather than the parent budgie layout) so budget-wide pages like
 * Settings don't render it.
 */
export default function WithMonthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { budgieId, isAdmin, selectedMonthId, setSelectedMonthId } =
    useBudgieDetail();

  return (
    <>
      <MonthSelector
        budgieId={budgieId}
        selectedMonthId={selectedMonthId}
        onSelectMonth={setSelectedMonthId}
        isAdmin={isAdmin}
      />
      <Separator />
      {children}
    </>
  );
}
