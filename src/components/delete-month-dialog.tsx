"use client";

import { api } from "@/lib/trpc/client";
import { DestructiveActionDialog } from "@/components/destructive-action-dialog";

function firstDayOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/**
 * Props for {@link DeleteMonthDialog}.
 */
interface DeleteMonthDialogProps {
  /** ID of the month to delete. */
  monthId: string;
  /** Human-readable label shown in the confirmation prompt (e.g. "March 2026"). */
  monthLabel: string;
  /** Owning budgie -- used for cache invalidation. */
  budgieId: string;
  /** Full list of months so a fallback can be selected after deletion. */
  months: { id: string; date: Date | string }[];
  /** Currently selected month -- if it matches `monthId` a new one is picked. */
  selectedMonthId: string | null;
  /** Called with the replacement month ID when the deleted month was selected. */
  onSelectMonth: (id: string) => void;
  /** Disables the trigger button. */
  disabled?: boolean;
  /** Extra classes forwarded to the trigger button. */
  triggerClassName?: string;
}

/**
 * Self-contained confirmation dialog for deleting a month. Owns the
 * `month.delete` mutation and picks a fallback selected month when the
 * deleted month was the active one.
 */
export function DeleteMonthDialog({
  monthId,
  monthLabel,
  budgieId,
  months,
  selectedMonthId,
  onSelectMonth,
  disabled = false,
  triggerClassName,
}: DeleteMonthDialogProps) {
  const utils = api.useUtils();

  const deleteMutation = api.month.delete.useMutation({
    onSuccess: (_data, variables) => {
      void utils.month.list.invalidate({ budgieId });
      if (selectedMonthId === variables.monthId) {
        const remaining = months.filter((m) => m.id !== variables.monthId);
        const current = firstDayOfMonth(new Date());
        const currentMonth = remaining.find((m) =>
          isSameMonth(new Date(m.date), current)
        );
        onSelectMonth(currentMonth?.id ?? remaining[0]?.id ?? "");
      }
    },
  });

  return (
    <DestructiveActionDialog
      title={`Delete ${monthLabel}?`}
      description="This will remove all expenses and notes for that month. This action cannot be undone."
      onConfirm={() => deleteMutation.mutateAsync({ monthId })}
      isPending={deleteMutation.isPending}
      disabled={disabled}
      triggerAriaLabel={`Delete ${monthLabel}`}
      triggerClassName={triggerClassName}
    />
  );
}
