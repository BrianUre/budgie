"use client";

import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
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
  ExpenseActivityList,
  type ExpenseActivityItem,
} from "@/components/expense-activity-list";
import { Plus } from "lucide-react";

type DraftOverride = { isActive: boolean; amount: number };

interface CreateNextMonthDialogProps {
  budgieId: string;
  onSuccess: (newMonthId: string) => void;
  trigger?: React.ReactNode;
}

export function CreateNextMonthDialog({
  budgieId,
  onSuccess,
  trigger,
}: CreateNextMonthDialogProps) {
  const utils = api.useUtils();
  const { data: months = [] } = api.month.list.useQuery(
    { budgieId },
    { enabled: !!budgieId }
  );
  const latestMonthId = months[0]?.id ?? null;
  const { data: expenses = [] } = api.expense.list.useQuery(
    { budgieId },
    { enabled: !!budgieId }
  );
  const { data: costsForLatestMonth = [] } = api.cost.listForMonth.useQuery(
    { monthId: latestMonthId!, budgieId },
    { enabled: !!latestMonthId && !!budgieId }
  );

  const [draftOverrides, setDraftOverrides] = useState<
    Record<string, DraftOverride>
  >({});
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (expenses.length === 0) return;
    setDraftOverrides((previous) => {
      const next = { ...previous };
      for (const expense of expenses) {
        if (next[expense.id] === undefined) {
          const cost = costsForLatestMonth.find(
            (costRow) => costRow.expenseId === expense.id
          );
          next[expense.id] = cost
            ? {
                isActive: cost.isActive,
                amount: Number(cost.amount),
              }
            : { isActive: true, amount: 0 };
        }
      }
      return next;
    });
  }, [expenses, costsForLatestMonth]);

  const createNextMutation = api.month.createNext.useMutation({
    onSuccess: (newMonth) => {
      void utils.month.list.invalidate({ budgieId });
      setOpen(false);
      onSuccess(newMonth.id);
    },
  });

  const activityItems: ExpenseActivityItem[] = useMemo(() => {
    return expenses.map((expense) => {
      const cost = costsForLatestMonth.find(
        (costRow) => costRow.expenseId === expense.id
      );
      return {
        expenseId: expense.id,
        expenseName: expense.name,
        costId: cost?.id ?? null,
        isActive: draftOverrides[expense.id]?.isActive ?? true,
        amount: draftOverrides[expense.id]?.amount ?? 0,
        destinationId: cost?.destination?.id ?? null,
      };
    });
  }, [expenses, draftOverrides]);

  const handleActiveChange = (
    expenseId: string,
    _costId: string | null,
    isActive: boolean
  ) => {
    setDraftOverrides((previous) => ({
      ...previous,
      [expenseId]: {
        ...previous[expenseId],
        isActive,
        amount: previous[expenseId]?.amount ?? 0,
      },
    }));
  };

  const handleAmountChange = (expenseId: string, amount: number) => {
    setDraftOverrides((previous) => ({
      ...previous,
      [expenseId]: {
        isActive: previous[expenseId]?.isActive ?? true,
        amount,
      },
    }));
  };

  const handleSubmit = () => {
    const costOverrides = expenses.map((expense) => ({
      expenseId: expense.id,
      isActive: draftOverrides[expense.id]?.isActive ?? true,
      amount: draftOverrides[expense.id]?.amount ?? 0,
    }));
    createNextMutation.mutate({ budgieId, costOverrides });
  };

  const defaultTrigger = (
    <Button variant="ghost" size="sm" disabled={createNextMutation.isPending} className="border-none hover:text-tertiary-hover">
      <Plus className="h-4 w-4" />
      <span className="ml-2">Add next month</span>
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create next month</DialogTitle>
          <DialogDescription>
            Choose which expenses to include and set their amounts for the new
            month. Inactive expenses will exist in the month but won&apos;t be
            shown or counted in totals.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto py-4">
          <ExpenseActivityList
            items={activityItems}
            onActiveChange={handleActiveChange}
            onAmountChange={handleAmountChange}
            showAmountInput
            allowToggleWhenNoCost
            disabled={createNextMutation.isPending}
          />
        </div>
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={createNextMutation.isPending || expenses.length === 0}
          >
            {createNextMutation.isPending ? "Creating…" : "Create month"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
