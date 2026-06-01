"use client";

import { BudgieSettingsCard } from "@/components/budgie-settings-card";
import { useBudgieDetail } from "../budgie-detail-context";

export default function SettingsTabPage() {
  const { budgieId, isAdmin, currency } = useBudgieDetail();

  return (
    <BudgieSettingsCard
      budgieId={budgieId}
      isAdmin={isAdmin}
      currency={currency}
    />
  );
}
