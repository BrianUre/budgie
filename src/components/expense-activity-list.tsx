"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DestinationDropdown } from "@/components/destination-dropdown";
import { Checkbox } from "./ui/checkbox";

export type ExpenseActivityItem = {
  expenseId: string;
  expenseName: string;
  costId: string | null;
  isActive: boolean;
  amount: number;
  destinationId: string | null;
};

interface ExpenseActivityListProps {
  items: ExpenseActivityItem[];
  onActiveChange: (
    expenseId: string,
    costId: string | null,
    isActive: boolean
  ) => void;
  onAmountChange?: (expenseId: string, amount: number) => void;
  onArchive?: (expenseId: string) => void;
  /** When true and costId is null, show "Add to month" button; parent handles amount and createForMonth. */
  showAddToMonthButton?: boolean;
  onAddToMonth?: (expenseId: string) => void;
  showAmountInput?: boolean;
  showArchiveButton?: boolean;
  /** When true, checkbox is enabled even when costId is null (e.g. draft mode for create next month). */
  allowToggleWhenNoCost?: boolean;
  /** When true, show destination dropdown per row (only for rows with costId). Requires budgieId and onDestinationChange. */
  showDestinationDropdown?: boolean;
  budgieId?: string;
  onDestinationChange?: (costId: string, destinationId: string | null) => void;
  /** Optional trigger (e.g. "Manage destinations" button) to open destination management. */
  manageDestinationsTrigger?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function ExpenseActivityList({
  items,
  onActiveChange,
  onAmountChange,
  onArchive,
  showAddToMonthButton = false,
  onAddToMonth,
  showAmountInput = false,
  showArchiveButton = false,
  allowToggleWhenNoCost = false,
  showDestinationDropdown = false,
  budgieId,
  onDestinationChange,
  manageDestinationsTrigger,
  disabled = false,
  className,
}: ExpenseActivityListProps) {
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
                disabled={
                  disabled ||
                  (item.costId === null && !allowToggleWhenNoCost)
                }
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
              onDestinationChange &&
              item.costId !== null && (
                <DestinationDropdown
                  budgieId={budgieId}
                  value={item.destinationId}
                  onValueChange={(destinationId) =>
                    onDestinationChange(item.costId!, destinationId)
                  }
                  disabled={disabled}
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
            {showArchiveButton && onArchive && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="ml-auto h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => onArchive(item.expenseId)}
              disabled={disabled}
              aria-label={`Archive ${item.expenseName}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          </li>
        ))}
      </ul>
    </div>
  );
}
