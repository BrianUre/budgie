"use client";

import { useState } from "react";
import { api } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";

/**
 * Props for {@link RemoveExpenseDialog}.
 */
interface RemoveExpenseDialogProps {
  /** ID of the expense to remove or archive. */
  expenseId: string;
  /** Display name shown in the confirmation prompt. */
  expenseName: string;
  /** Owning budgie – used for authorization and cache invalidation. */
  budgieId: string;
  /** The currently selected month – costs only in this month are hard-deleted. */
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
  const [open, setOpen] = useState(false);
  const utils = api.useUtils();

  const archiveMutation = api.expense.archive.useMutation({
    onSuccess: () => {
      setOpen(false);
      void utils.expense.list.invalidate({ budgieId });
      void utils.cost.listForMonth.invalidate({
        monthId: selectedMonthId,
        budgieId,
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={(next) => !archiveMutation.isPending && setOpen(next)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="ml-auto h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
        disabled={disabled}
        aria-label={`Remove ${expenseName}`}
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove &ldquo;{expenseName}&rdquo;?</DialogTitle>
          <DialogDescription>
            If this expense is used in other months it will be archived and
            hidden from future months. Otherwise it will be permanently deleted.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={archiveMutation.isPending}
            onClick={() =>
              archiveMutation.mutate({
                expenseId,
                budgieId,
                monthId: selectedMonthId,
              })
            }
          >
            {archiveMutation.isPending ? "Removing\u2026" : "Remove"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
