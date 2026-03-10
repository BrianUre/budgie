"use client";

import { createContext, useContext } from "react";

type Contributor = {
  id: string;
  name: string | null;
  userId?: string | null;
  user?: {
    name?: string | null;
    email?: string | null;
    imageUrl?: string | null;
  } | null;
};

type Destination = {
  id: string;
  name: string | null;
};

export type BudgieDetailContextValue = {
  budgieId: string;
  budgie: { name: string };
  isAdmin: boolean;
  contributors: Contributor[];
  contributorsWithSessionFirst: Contributor[];
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
