"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { api } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatMoney } from "@/lib/utils";
import { Pencil, Plus } from "lucide-react";

type Contributor = {
  id: string;
  name: string | null;
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
}: {
  costId: string;
  costAmount: number;
  contribution: Contribution | undefined;
  isAdmin: boolean;
  monthId: string;
  budgieId: string;
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
console.log("contribution", contribution);

  return (
    <div>
    <div className="grid max-w-48 grid-cols-2 justify-items-end gap-4">
      <span className="font-mono text-2xl">{formatMoney(amount)}</span>
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
          className={
            isAdmin
              ? "cursor-pointer text-xl hover:underline"
              : "text-muted-foreground text-xs"
          }
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

function AddExpenseDialog({
  budgieId,
  selectedMonthId,
}: {
  budgieId: string;
  selectedMonthId: string | null;
}) {
  const utils = api.useUtils();
  const expenseMutation = api.expense.create.useMutation({
    onSuccess: () => {
      void utils.expense.list.invalidate({ budgieId });
      if (selectedMonthId) {
        void utils.contribution.listForMonth.invalidate({
          monthId: selectedMonthId,
        });
        void utils.cost.listForMonth.invalidate({
          monthId: selectedMonthId,
          budgieId,
        });
      }
    },
  });

  const expenseForm = useForm({
    defaultValues: { name: "", initialAmount: 0 },
    onSubmit: async ({ value }) => {
      if (!selectedMonthId) return;
      await expenseMutation.mutateAsync({
        budgieId,
        monthId: selectedMonthId,
        name: value.name,
        initialAmount: value.initialAmount,
      });
    },
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" disabled={!selectedMonthId}>
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            expenseForm.handleSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>Add expense</DialogTitle>
            <DialogDescription>
              Name and initial cost for the selected month.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <expenseForm.Field name="name">
              {(field) => (
                <div className="grid gap-2">
                  <Label>Name</Label>
                  <Input
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g. Rent"
                  />
                </div>
              )}
            </expenseForm.Field>
            <expenseForm.Field name="initialAmount">
              {(field) => (
                <div className="grid gap-2">
                  <Label>Initial amount</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={field.state.value || ""}
                    onChange={(e) =>
                      field.handleChange(parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
              )}
            </expenseForm.Field>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={!selectedMonthId || expenseMutation.isPending}
            >
              {expenseMutation.isPending ? "Adding…" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
}: {
  costs: CostRow[];
  contributors: Contributor[];
  isAdmin: boolean;
  budgieId: string;
  selectedMonthId: string;
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
  console.log("costs", costs);

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
                <TableCell key={contributor.id}>
                  <ContributionCell
                    costId={cost.id}
                    costAmount={Number(cost.amount)}
                    contribution={cost.contributions.find(
                      (contribution: Contribution) => contribution.contributorId === contributor.id
                    )}
                    isAdmin={isAdmin}
                    monthId={selectedMonthId}
                    budgieId={budgieId}
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

function TotalsPanel({
  contributors,
  costs,
}: {
  contributors: Contributor[];
  costs: CostRow[];
}) {
  const totalCostAmount = useMemo(
    () => costs.reduce((sum, cost) => sum + Number(cost.amount), 0),
    [costs]
  );

  const totalByContributor = useMemo(() => {
    const map = new Map<string, number>();
    for (const contributor of contributors) {
      let total = 0;
      for (const cost of costs) {
        const contribution = cost.contributions?.find(
          (c: Contribution) => c.contributorId === contributor.id
        );
        if (contribution) {
          total +=
            Number(cost.amount) * (Number(contribution.percentage) / 100);
        }
      }
      map.set(contributor.id, total);
    }
    return map;
  }, [contributors, costs]);

  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-muted-foreground">
        Totals
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Total costs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">
              {formatMoney(totalCostAmount)}
            </p>
          </CardContent>
        </Card>
        {contributors.map((contributor) => (
          <Card key={contributor.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {contributor.user?.name ??
                  contributor.user?.email ??
                  contributor.name ??
                  "—"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">
                {formatMoney(totalByContributor.get(contributor.id) ?? 0)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function BudgieView({
  budgieId,
  selectedMonthId,
  isAdmin,
  contributors,
  className,
}: {
  budgieId: string;
  selectedMonthId: string | null;
  isAdmin: boolean;
  contributors: Contributor[];
  className?: string;
}) {
  const { data: costs = [] } = api.cost.listForMonth.useQuery(
    { monthId: selectedMonthId!, budgieId },
    { enabled: !!selectedMonthId }
  );

  if (!selectedMonthId) {
    return (
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle>Expenses &amp; contributions</CardTitle>
          <CardDescription>
            Costs are per month; select a month to see and edit expenses and
            contribution split.
          </CardDescription>
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
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Expenses &amp; contributions</CardTitle>
            <CardDescription>
              Costs are per month; add an expense to track it. Set each
              contributor&apos;s share per cost (percentages sum to 100%).
            </CardDescription>
          </div>
          {isAdmin && (
            <AddExpenseDialog
              budgieId={budgieId}
              selectedMonthId={selectedMonthId}
            />
          )}
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <ExpensesTable
            costs={costs}
            contributors={contributors}
            isAdmin={isAdmin}
            budgieId={budgieId}
            selectedMonthId={selectedMonthId}
          />
        </CardContent>
      </Card>

      {contributors.length > 0 && (
        <TotalsPanel contributors={contributors} costs={costs} />
      )}
    </div>
  );
}
