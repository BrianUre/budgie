"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ManageExpensesDialog } from "@/components/manage-expenses-dialog";
import { cn } from "@/lib/utils";
import { ReceiptText } from "lucide-react";
import type { CostsForClient } from "@/lib/trpc/client";
import { ExpensesTable } from "@/components/expenses-table";

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

export function ExpensesView({
  budgieId,
  selectedMonthId,
  isAdmin,
  contributors,
  currentUserId,
  className,
  costsForMonth,
}: {
  budgieId: string;
  selectedMonthId: string | null;
  isAdmin: boolean;
  contributors: Contributor[];
  currentUserId?: string | null;
  className?: string;
  costsForMonth: CostsForClient;
}) {
  const activeCosts = useMemo(
    () => costsForMonth.filter((cost) => cost.isActive),
    [costsForMonth]
  );

  if (!selectedMonthId) {
    return (
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle>Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Select a month to see expenses and contributions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between px-4 py-0">
          <div className="flex items-center gap-2">
            <ReceiptText className="h-6 w-6 text-tertiary" />
            <CardTitle className="text-base sm:text-2xl font-zain font-medium">Expenses</CardTitle>
          </div>

          {isAdmin && (
            <ManageExpensesDialog
              budgieId={budgieId}
              selectedMonthId={selectedMonthId}
            />
          )}
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <ExpensesTable
            costs={activeCosts}
            contributors={contributors}
            isAdmin={isAdmin}
            budgieId={budgieId}
            selectedMonthId={selectedMonthId}
            currentUserId={currentUserId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
