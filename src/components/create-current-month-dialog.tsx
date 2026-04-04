"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

interface CreateCurrentMonthDialogProps {
  budgieId: string;
  trigger?: React.ReactNode;
}

export function CreateCurrentMonthDialog({
  budgieId,
  trigger,
}: CreateCurrentMonthDialogProps) {
  const router = useRouter();
  const utils = api.useUtils();
  const [open, setOpen] = useState(false);

  const ensureCurrentMonth = api.month.ensureCurrentMonth.useMutation({
    onSuccess: () => {
      void utils.budgie.listForDashboard.invalidate();
      void utils.month.list.invalidate({ budgieId });
      setOpen(false);
      router.push(`/budgie/${budgieId}`);
    },
  });

  const defaultTrigger = (
    <Button type="button" disabled={ensureCurrentMonth.isPending}>
      Create current month
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create current month</DialogTitle>
          <DialogDescription>
            Adds a sheet for this calendar month (UTC). If you already have
            other months, expenses are copied from your latest month so you can
            adjust them in the budgie.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setOpen(false)}
            disabled={ensureCurrentMonth.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => ensureCurrentMonth.mutate({ budgieId })}
            disabled={ensureCurrentMonth.isPending}
          >
            {ensureCurrentMonth.isPending ? "Creating…" : "Create month"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
