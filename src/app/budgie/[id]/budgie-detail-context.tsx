"use client";

import { createContext, useContext } from "react";
import type { ContributorListItem } from "@/server/api/routers/contributor";
import type { DestinationListItem } from "@/server/api/routers/destination";

export type Destination = DestinationListItem;

export type BudgieDetailContextValue = {
  budgieId: string;
  budgie: { name: string };
  isAdmin: boolean;
  contributors: ContributorListItem[];
  contributorsWithSessionFirst: ContributorListItem[];
  destinations: Destination[];
  selectedMonthId: string | null;
  setSelectedMonthId: (id: string | null) => void;
  userId: string | null;
};

const BudgieDetailContext = createContext<BudgieDetailContextValue | null>(null);

export function useBudgieDetail() {
  const ctx = useContext(BudgieDetailContext);
  if (!ctx) throw new Error("useBudgieDetail must be used within BudgieDetailLayout");
  return ctx;
}

export function BudgieDetailProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: BudgieDetailContextValue;
}) {
  return (
    <BudgieDetailContext.Provider value={value}>
      {children}
    </BudgieDetailContext.Provider>
  );
}
