"use client";

import { useState } from "react";
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
import { cn } from "@/lib/utils";

/**
 * Props for {@link DestructiveActionDialog}.
 */
interface DestructiveActionDialogProps {
  /** Dialog title shown in the header. */
  title: string;
  /** Explanatory text shown below the title. */
  description: string;
  /**
   * Called when the user clicks the confirm button. If it returns a promise the
   * dialog auto-closes on resolve; synchronous returns close immediately.
   */
  onConfirm: () => Promise<unknown> | void;
  /** Whether the action is currently in-flight. Disables confirm and prevents closing. */
  isPending?: boolean;
  /** Label for the confirm button in its idle state. @default "Delete" */
  confirmLabel?: string;
  /** Label for the confirm button while `isPending` is true. @default "Deleting…" */
  pendingLabel?: string;
  /** Disables the trigger button. */
  disabled?: boolean;
  /** Accessible label for the trigger button. */
  triggerAriaLabel: string;
  /** Extra classes merged onto the trigger button (e.g. visibility overrides). */
  triggerClassName?: string;
}

/**
 * A reusable confirmation dialog for destructive actions. Renders a trash-icon
 * trigger button that opens a dialog with a configurable title, description,
 * and a Cancel / Confirm footer. The dialog auto-closes when `onConfirm`
 * resolves.
 */
export function DestructiveActionDialog({
  title,
  description,
  onConfirm,
  isPending = false,
  confirmLabel = "Delete",
  pendingLabel = "Deleting\u2026",
  disabled = false,
  triggerAriaLabel,
  triggerClassName,
}: DestructiveActionDialogProps) {
  const [open, setOpen] = useState(false);

  const handleConfirm = async () => {
    await onConfirm();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isPending && setOpen(next)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "ml-auto h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive",
          triggerClassName,
        )}
        disabled={disabled}
        aria-label={triggerAriaLabel}
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
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
            disabled={isPending}
            onClick={handleConfirm}
          >
            {isPending ? pendingLabel : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
