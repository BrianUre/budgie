"use client";

import { useMemo, useState } from "react";
import { useForm } from "@tanstack/react-form";
import { api } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { DestinationDropdown } from "@/components/destination-dropdown";
import { AddDestinationDialog } from "@/components/add-destination-dialog";
import { Plus } from "lucide-react";

interface ManageExpensesDialogProps {
  budgieId: string;
  selectedMonthId: string | null;
  trigger?: React.ReactNode;
}

export function ManageExpensesDialog({
  budgieId,
  selectedMonthId,
  trigger,
}: ManageExpensesDialogProps) {
  const utils = api.useUtils();
  const { data: expenses = [] } = api.expense.list.useQuery(
    { budgieId },
    { enabled: !!budgieId }
  );
  const { data: costsForMonth = [] } = api.cost.listForMonth.useQuery(
    { monthId: selectedMonthId!, budgieId },
    { enabled: !!selectedMonthId && !!budgieId }
  );

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

  const setActiveMutation = api.cost.setActive.useMutation({
    onMutate: async (variables) => {
      if (!selectedMonthId) return;
      const queryKey = { monthId: selectedMonthId, budgieId };
      await utils.cost.listForMonth.cancel(queryKey);
      const previousCosts = utils.cost.listForMonth.getData(queryKey);
      utils.cost.listForMonth.setData(queryKey, (old) =>
        old?.map((cost) =>
          cost.id === variables.costId
            ? { ...cost, isActive: variables.isActive }
            : cost
        )
      );
      return { previousCosts };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousCosts && selectedMonthId) {
        utils.cost.listForMonth.setData(
          { monthId: selectedMonthId, budgieId },
          context.previousCosts
        );
      }
    },
    onSettled: () => {
      if (selectedMonthId) {
        void utils.cost.listForMonth.invalidate({
          monthId: selectedMonthId,
          budgieId,
        });
      }
    },
  });

  const createForMonthMutation = api.cost.createForMonth.useMutation({
    onSuccess: () => {
      if (selectedMonthId) {
        void utils.cost.listForMonth.invalidate({
          monthId: selectedMonthId,
          budgieId,
        });
        void utils.contribution.listForMonth.invalidate({
          monthId: selectedMonthId,
        });
      }
    },
  });

  /** Kept in component state so it survives form reset (TanStack Form can revert to defaultValues after async reset). */
  const [addExpenseDestinationId, setAddExpenseDestinationId] = useState<string | null>(null);

  const expenseForm = useForm({
    defaultValues: { name: "", initialAmount: 0 },
    onSubmit: async ({ value }) => {
      if (!selectedMonthId) return;
      await expenseMutation.mutateAsync({
        budgieId,
        monthId: selectedMonthId,
        name: value.name.trim(),
        initialAmount: value.initialAmount,
        destinationId: addExpenseDestinationId,
      });
      expenseForm.reset();
      // Destination is intentionally not reset so the user can add multiple expenses to the same destination.
    },
  });

  const activityItems: ExpenseActivityItem[] = useMemo(() => {
    return expenses.map((expense) => {
      const cost = costsForMonth.find(
        (costRow) => costRow.expenseId === expense.id
      );
      return {
        expenseId: expense.id,
        expenseName: expense.name,
        costId: cost?.id ?? null,
        isActive: cost?.isActive ?? false,
        amount: cost ? Number(cost.amount) : 0,
        destinationId: cost?.destinationId ?? cost?.destination?.id ?? null,
      };
    });
  }, [expenses, costsForMonth]);

  const handleActiveChange = (
    _expenseId: string,
    costId: string | null,
    isActive: boolean
  ) => {
    if (costId === null) return;
    setActiveMutation.mutate({ costId, isActive, budgieId });
  };

  const handleAddToMonth = (expenseId: string) => {
    if (!selectedMonthId) return;
    const raw = window.prompt("Initial amount for this month?", "0");
    const amount = parseFloat(raw ?? "0");
    if (Number.isNaN(amount) || amount < 0) return;
    createForMonthMutation.mutate({
      monthId: selectedMonthId,
      expenseId,
      amount,
      budgieId,
    });
  };

  const defaultTrigger = (
    <Button size="sm" variant="ghost" disabled={!selectedMonthId} className="hover:text-tertiary-hover">
      <Plus className="h-4 w-4" />
      Manage expenses
    </Button>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage expenses</DialogTitle>
          <DialogDescription>
            Add a new expense or toggle which costs are active for the selected
            month. Archived expenses are hidden from future months.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto py-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              expenseForm.handleSubmit();
            }}
            className="space-y-4"
          >
            <div className="space-y-2 px-2">
              <Label>Add new expense</Label>
                <expenseForm.Field name="name">
                  {(field) => (
                    <div className="grid gap-2">
                      <Label htmlFor="expense-name" className="sr-only">
                        Name
                      </Label>
                      <Input
                        id="expense-name"
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
                      <Label htmlFor="expense-amount" className="sr-only">
                        Initial amount
                      </Label>
                      <Input
                        id="expense-amount"
                        type="number"
                        min={0}
                        step={0.01}
                        value={field.state.value ?? ""}
                        onChange={(e) =>
                          field.handleChange(parseFloat(e.target.value) || 0)
                        }
                        placeholder="0"
                      />
                    </div>
                  )}
                </expenseForm.Field>

                <Label htmlFor="expense-destination" className="sr-only">
                  Destination
                </Label>
                <DestinationDropdown
                  budgieId={budgieId}
                  value={addExpenseDestinationId}
                  onValueChange={setAddExpenseDestinationId}
                  placeholder="Destination"
                />
              <expenseForm.Subscribe
                selector={(state): [string, number, boolean] => [
                  state.values.name,
                  state.values.initialAmount,
                  state.isSubmitting,
                ]}
              >
                {([name, initialAmount, isSubmitting]) => (
                  <Button
                    type="submit"
                    size="sm"
                    disabled={
                      !selectedMonthId ||
                      isSubmitting ||
                      expenseMutation.isPending ||
                      !name.trim() ||
                      Number.isNaN(initialAmount) ||
                      initialAmount < 0
                    }
                  >
                    {expenseMutation.isPending ? "Adding…" : "Add"}
                  </Button>
                )}
              </expenseForm.Subscribe>
            </div>
          </form>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Expenses for this month</Label>
              <AddDestinationDialog
                budgieId={budgieId}
                trigger={
                  <Button type="button" variant="ghost" size="sm">
                    Manage destinations
                  </Button>
                }
              />
            </div>
            <ExpenseActivityList
              items={activityItems}
              onActiveChange={handleActiveChange}
              showAddToMonthButton
              onAddToMonth={handleAddToMonth}
              showArchiveButton
              showDestinationDropdown
              budgieId={budgieId}
              selectedMonthId={selectedMonthId}
              disabled={
                setActiveMutation.isPending ||
                createForMonthMutation.isPending
              }
            />
          </div>
        </div>
        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
}
