"use client";

import { api } from "@/lib/trpc/client";
import { DestructiveActionDialog } from "@/components/destructive-action-dialog";

/**
 * Props for {@link RemoveExpenseDialog}.
 */
interface RemoveExpenseDialogProps {
  /** ID of the expense to remove or archive. */
  expenseId: string;
  /** Display name shown in the confirmation prompt. */
  expenseName: string;
  /** Owning budgie -- used for authorization and cache invalidation. */
  budgieId: string;
  /** The currently selected month -- costs only in this month are hard-deleted. */
  selectedMonthId: string;
  /** Disables the trigger button. */
  disabled?: boolean;
}

/**
 * Confirmation dialog for removing an expense. If the expense has costs in
 * months other than the selected one it is soft-archived; otherwise it is
 * permanently deleted. The mutation and cache invalidation are fully
 * self-contained.
 */
export function RemoveExpenseDialog({
  expenseId,
  expenseName,
  budgieId,
  selectedMonthId,
  disabled = false,
}: RemoveExpenseDialogProps) {
  const utils = api.useUtils();

  const archiveMutation = api.expense.archive.useMutation({
    onSuccess: () => {
      void utils.expense.list.invalidate({ budgieId });
      void utils.cost.listForMonth.invalidate({
        monthId: selectedMonthId,
        budgieId,
      });
    },
  });

  return (
    <DestructiveActionDialog
      title={`Remove \u201c${expenseName}\u201d?`}
      description="If this expense is used in other months it will be archived and hidden from future months. Otherwise it will be permanently deleted."
      onConfirm={() =>
        archiveMutation.mutateAsync({
          expenseId,
          budgieId,
          monthId: selectedMonthId,
        })
      }
      isPending={archiveMutation.isPending}
      confirmLabel="Remove"
      pendingLabel="Removing\u2026"
      disabled={disabled}
      triggerAriaLabel={`Remove ${expenseName}`}
    />
  );
}
