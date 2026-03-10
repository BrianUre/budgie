"use client";

import { DestinationsCard } from "@/components/destinations-card";
import { useBudgieDetail } from "../budgie-detail-context";

export default function DestinationsTabPage() {
  const { budgieId, isAdmin, destinations } = useBudgieDetail();

  return (
    <DestinationsCard
      budgieId={budgieId}
      isAdmin={isAdmin}
      destinations={destinations}
    />
  );
}
