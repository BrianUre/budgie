"use client";

import { useMemo, useState } from "react";
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
import { cn, formatMoney } from "@/lib/utils";
import { Pencil, Plus } from "lucide-react";

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
          onBlur={handleSave}
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
      className="flex items-center gap-1 hover:underline"
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

function ExpenseCostRow({
  expense,
  cost,
  selectedMonthId,
  isAdmin,
  onSaveCost,
  isCostPending,
}: {
  expense: { id: string; name: string };
  cost: { id: string; amount: unknown };
  selectedMonthId: string | null;
  isAdmin: boolean;
  onSaveCost: (costId: string, amount: number) => Promise<unknown>;
  isCostPending: boolean;
}) {
  const amount = Number(cost.amount);

  return (
    <li className="flex items-center justify-between rounded border p-2">
      <span>{expense.name}</span>
      {selectedMonthId && (
        <span className="font-mono">
          {isAdmin ? (
            <CostEdit
              value={amount}
              onSave={(v) => onSaveCost(cost.id, v)}
              isPending={isCostPending}
            />
          ) : (
            formatMoney(amount)
          )}
        </span>
      )}
    </li>
  );
}

export function ExpensesView({
  budgieId,
  selectedMonthId,
  isAdmin,
  className,
}: {
  budgieId: string;
  selectedMonthId: string | null;
  isAdmin: boolean;
  className?: string;
}) {
  const utils = api.useUtils();
  const { data: expenses = [] } = api.expense.list.useQuery(
    { budgieId },
    { enabled: !!budgieId }
  );
  const { data: costs = [] } = api.cost.listForMonth.useQuery(
    { monthId: selectedMonthId!, budgieId },
    { enabled: !!selectedMonthId }
  );
  const costMutation = api.cost.updateAmount.useMutation({
    onSuccess: () => {
      if (selectedMonthId) {
        void utils.cost.listForMonth.invalidate({ monthId: selectedMonthId });
      }
    },
  });
  const expenseMutation = api.expense.create.useMutation({
    onSuccess: () => {
      void utils.expense.list.invalidate({ budgieId });
      void utils.contribution.listForMonth.invalidate({ monthId: selectedMonthId! });
      if (selectedMonthId) {
        void utils.cost.listForMonth.invalidate({ monthId: selectedMonthId });
      }
    },
  });

  const costByExpense = useMemo(() => {
    const map = new Map<string, (typeof costs)[0]>();
    for (const cost of costs) {
      map.set(cost.expenseId, cost);
    }
    return map;
  }, [costs]);

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
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Expenses</CardTitle>
          <CardDescription>
            Costs are per month; add an expense to track it.
          </CardDescription>
        </div>
        {isAdmin && (
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
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
                          onChange={(e) =>
                            field.handleChange(e.target.value)
                          }
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
                            field.handleChange(
                              parseFloat(e.target.value) || 0
                            )
                          }
                        />
                      </div>
                    )}
                  </expenseForm.Field>
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={
                      !selectedMonthId || expenseMutation.isPending
                    }
                  >
                    {expenseMutation.isPending ? "Adding…" : "Add"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {expenses
            .filter((expense) => costByExpense.has(expense.id))
            .map((expense) => {
              const cost = costByExpense.get(expense.id)!;
              return (
                <ExpenseCostRow
                  key={expense.id}
                  expense={expense}
                  cost={cost}
                  selectedMonthId={selectedMonthId}
                  isAdmin={isAdmin}
                  onSaveCost={(costId, amount) =>
                    costMutation.mutateAsync({
                      budgieId,
                      costId,
                      amount,
                    })
                  }
                  isCostPending={costMutation.isPending}
                />
              );
            })}
          {expenses.length === 0 && (
            <li className="text-muted-foreground text-sm">
              No expenses yet. Add one to get started.
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
