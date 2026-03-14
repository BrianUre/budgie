"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { api } from "@/lib/trpc/client";
import { DestinationDropdown } from "@/components/destination-dropdown";
import { RemoveExpenseDialog } from "@/components/remove-expense-dialog";
import { Checkbox } from "./ui/checkbox";

/** A single row in the expense activity list. */
export type ExpenseActivityItem = {
  expenseId: string;
  expenseName: string;
  costId: string | null;
  isActive: boolean;
  amount: number;
  destinationId: string | null;
};

/**
 * Displays a list of expense rows with toggles, optional amount inputs,
 * destination dropdowns, and archive actions. The destination-change mutation
 * and the archive confirmation dialog are self-contained; the parent only
 * needs to supply callbacks that vary by context (e.g. active-change, amount).
 */
interface ExpenseActivityListProps {
  /** Expense rows to render. */
  items: ExpenseActivityItem[];
  /** Called when a row's active checkbox changes. */
  onActiveChange: (
    expenseId: string,
    costId: string | null,
    isActive: boolean
  ) => void;
  /** Called when the inline amount input changes (requires `showAmountInput`). */
  onAmountChange?: (expenseId: string, amount: number) => void;
  /** When true and costId is null, show "Add to month" button; parent handles amount and createForMonth. */
  showAddToMonthButton?: boolean;
  /** Called when the "Add to month" button is clicked (requires `showAddToMonthButton`). */
  onAddToMonth?: (expenseId: string) => void;
  /** Show an inline number input for each row's amount. */
  showAmountInput?: boolean;
  /** Show the remove/archive action per row (renders {@link RemoveExpenseDialog}). Requires `budgieId` and `selectedMonthId`. */
  showArchiveButton?: boolean;
  /** When true, checkbox is enabled even when costId is null (e.g. draft mode for create next month). */
  allowToggleWhenNoCost?: boolean;
  /** Show a destination dropdown per row (only for rows with costId). Requires `budgieId` and `selectedMonthId`. */
  showDestinationDropdown?: boolean;
  /** Budgie that owns these expenses. Required when `showDestinationDropdown` or `showArchiveButton` is true. */
  budgieId?: string;
  /** Currently selected month. Required when `showDestinationDropdown` or `showArchiveButton` is true. */
  selectedMonthId?: string | null;
  /** Optional trigger (e.g. "Manage destinations" button) to open destination management. */
  manageDestinationsTrigger?: React.ReactNode;
  /** Disables all interactive controls. */
  disabled?: boolean;
  className?: string;
}

export function ExpenseActivityList({
  items,
  onActiveChange,
  onAmountChange,
  showAddToMonthButton = false,
  onAddToMonth,
  showAmountInput = false,
  showArchiveButton = false,
  allowToggleWhenNoCost = false,
  showDestinationDropdown = false,
  budgieId,
  selectedMonthId,
  manageDestinationsTrigger,
  disabled = false,
  className,
}: ExpenseActivityListProps) {
  const utils = api.useUtils();

  const updateDestinationMutation = api.cost.updateDestination.useMutation({
    onSuccess: () => {
      if (selectedMonthId && budgieId) {
        void utils.cost.listForMonth.invalidate({
          monthId: selectedMonthId,
          budgieId,
        });
      }
    },
  });

  if (items.length === 0) {
    return (
      <p className={cn("text-muted-foreground text-sm", className)}>
        No expenses to show.
      </p>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {manageDestinationsTrigger && (
        <div className="flex justify-end">{manageDestinationsTrigger}</div>
      )}
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.expenseId}
            className="grid grid-cols-3 items-center gap-3 rounded-md border px-3 py-2"
          >
            <label className="flex cursor-pointer items-center gap-2">
              <Checkbox
                checked={item.isActive}
                onCheckedChange={(checked) =>
                  onActiveChange(item.expenseId, item.costId, checked as boolean)
                }
                aria-label={`${item.expenseName} active`}
              />
              <span className="font-medium">{item.expenseName}</span>
            </label>
            {showAmountInput && onAmountChange && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={item.amount}
                  onChange={(event) => {
                    const value = parseFloat(event.target.value);
                    if (!Number.isNaN(value) && value >= 0) {
                      onAmountChange(item.expenseId, value);
                    }
                  }}
                  disabled={disabled}
                  className="h-8 w-24"
                />
              </div>
            )}
            {showDestinationDropdown &&
              budgieId &&
              item.costId !== null && (
                <DestinationDropdown
                  budgieId={budgieId}
                  value={item.destinationId}
                  onValueChange={(destinationId) =>
                    updateDestinationMutation.mutate({
                      costId: item.costId!,
                      destinationId,
                      budgieId: budgieId!,
                    })
                  }
                  disabled={disabled || updateDestinationMutation.isPending}
                  placeholder="Destination"
                  className="h-8 min-w-[10rem]"
                />
              )}
            {showAddToMonthButton &&
              onAddToMonth &&
              item.costId === null && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                onClick={() => onAddToMonth(item.expenseId)}
                disabled={disabled}
              >
                Add to month
              </Button>
            )}
            {showArchiveButton && budgieId && selectedMonthId && (
              <RemoveExpenseDialog
                expenseId={item.expenseId}
                expenseName={item.expenseName}
                budgieId={budgieId}
                selectedMonthId={selectedMonthId}
                disabled={disabled}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
