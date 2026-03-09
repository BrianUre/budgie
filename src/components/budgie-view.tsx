"use client";

import { useMemo, useState } from "react";
import { api } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ManageExpensesDialog } from "@/components/manage-expenses-dialog";
import { cn, formatMoney } from "@/lib/utils";
import { Pencil } from "lucide-react";
import { Costs } from "@/server/services/cost.service";

type Contributor = {
  id: string;
  name: string | null;
  userId?: string | null;
  user?: { name?: string | null; email?: string | null } | null;
};

type Contribution = {
  id: string;
  costId: string;
  contributorId: string;
  percentage: unknown;
};

function CostEdit({
  value,
  onSave,
  isPending,
}: {
  value: number;
  onSave: (v: number) => Promise<unknown>;
  isPending: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  const handleSave = async () => {
    const v = parseFloat(draft);
    if (!Number.isNaN(v) && v >= 0) {
      await onSave(v);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <span className="flex items-center gap-1">
        <Input
          type="number"
          min={0}
          step={0.01}
          className="h-8 w-24"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => void handleSave()}
          onKeyDown={(e) => e.key === "Enter" && void handleSave()}
        />
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={() => void handleSave()}
          disabled={isPending}
        >
          <Pencil className="h-3 w-3" />
        </Button>
      </span>
    );
  }
  return (
    <button
      type="button"
      className="flex items-center gap-1 hover:underline text-2xl"
      onClick={() => {
        setDraft(String(value));
        setEditing(true);
      }}
    >
      {formatMoney(value)}
      <Pencil className="h-3 w-3 opacity-70" />
    </button>
  );
}

function ContributionCell({
  costId,
  costAmount,
  contribution,
  isAdmin,
  monthId,
  budgieId,
  isCurrentUser,
}: {
  costId: string;
  costAmount: number;
  contribution: Contribution | undefined;
  isAdmin: boolean;
  monthId: string;
  budgieId: string;
  isCurrentUser?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const utils = api.useUtils();
  const setPercentageMutation = api.contribution.setPercentage.useMutation({
    onSuccess: () => {
      void utils.contribution.listForMonth.invalidate({ monthId });
      void utils.cost.listForMonth.invalidate({ monthId, budgieId });
    },
  });

  const percentage = contribution ? Number(contribution.percentage) : 0;
  const amount = costAmount * (percentage / 100);

  const handleSave = async () => {
    console.log("draft", draft);
    const value = parseFloat(draft);
    if (
      !Number.isNaN(value) &&
      value >= 0 &&
      value <= 100 &&
      contribution
    ) {
      await setPercentageMutation.mutateAsync({
        costId,
        contributionId: contribution.id,
        percentage: value,
      });
      setEditing(false);
    }
  };

  return (
    <div>
    <div className="grid max-w-48 grid-cols-2 justify-items-end gap-4">
      <span
        className={cn(
          "font-mono text-2xl",
          isCurrentUser && "text-primary font-semibold"
        )}
      >
        {formatMoney(amount)}
      </span>
      {isAdmin && editing ? (
        <span className="flex items-center gap-1">
          <Input
            type="number"
            min={0}
            max={100}
            step={0.5}
            className="h-8 w-16"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => void handleSave()}
            onKeyDown={(e) => e.key === "Enter" && void handleSave()}
          />
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => void handleSave()}
            disabled={setPercentageMutation.isPending}
          >
            <Pencil className="h-3 w-3" />
          </Button>
        </span>
      ) : (
        <span
          className={cn(
            isAdmin
              ? "cursor-pointer text-xl hover:underline"
              : "text-muted-foreground text-xs",
            isCurrentUser && "text-primary font-semibold"
          )}
          onClick={
            isAdmin
              ? () => {
                  setDraft(String(percentage));
                  setEditing(true);
                }
              : undefined
          }
          onKeyDown={
            isAdmin
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setDraft(String(percentage));
                    setEditing(true);
                  }
                }
              : undefined
          }
            role={isAdmin ? "button" : undefined}
          tabIndex={isAdmin ? 0 : undefined}
        >
          {percentage}%
        </span>
      )}
    </div>
    </div>
  );
}

type CostRow = {
  id: string;
  amount: unknown;
  expense: { name: string } | null;
  contributions: Contribution[];
};

function ExpensesTable({
  costs,
  contributors,
  isAdmin,
  budgieId,
  selectedMonthId,
  currentUserId,
}: {
  costs: CostRow[];
  contributors: Contributor[];
  isAdmin: boolean;
  budgieId: string;
  selectedMonthId: string;
  currentUserId?: string | null;
}) {
  const utils = api.useUtils();
  const costMutation = api.cost.updateAmount.useMutation({
    onSuccess: () => {
      void utils.cost.listForMonth.invalidate({
        monthId: selectedMonthId,
        budgieId,
      });
    },
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Expense</TableHead>
          <TableHead>Cost</TableHead>
          {contributors.map((c) => (
            <TableHead key={c.id}>{c.user?.name ?? c.name ?? "—"}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {costs.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={2 + contributors.length}
              className="text-muted-foreground text-center"
            >
              No expenses yet. Add one to get started.
            </TableCell>
          </TableRow>
        ) : (
          costs.map((cost) => (
            <TableRow key={cost.id}>
              <TableCell className="font-medium text-2xl">
                {cost.expense?.name ?? "—"}
              </TableCell>
              <TableCell className="font-mono text-2xl">
                {isAdmin ? (
                  <CostEdit
                    value={Number(cost.amount)}
                    onSave={(v) =>
                      costMutation.mutateAsync({
                        budgieId,
                        costId: cost.id,
                        amount: v,
                      })
                    }
                    isPending={costMutation.isPending}
                  />
                ) : (
                  formatMoney(Number(cost.amount))
                )}
              </TableCell>
              {contributors.map((contributor) => (
                <TableCell
                  key={contributor.id}
                  className={cn(
                    currentUserId &&
                      contributor.userId === currentUserId &&
                      "bg-primary/5"
                  )}
                >
                  <ContributionCell
                    costId={cost.id}
                    costAmount={Number(cost.amount)}
                    contribution={cost.contributions.find(
                      (contribution: Contribution) => contribution.contributorId === contributor.id
                    )}
                    isAdmin={isAdmin}
                    monthId={selectedMonthId}
                    budgieId={budgieId}
                    isCurrentUser={
                      !!currentUserId && contributor.userId === currentUserId
                    }
                  />
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

export function BudgieView({
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
  costsForMonth: Costs;
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
        <CardHeader className="flex sm:flex-row items-start sm:items-center justify-between px-4 py-0">
          <div>
            <CardTitle className="text-base sm:text-2xl">Expenses</CardTitle>
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
