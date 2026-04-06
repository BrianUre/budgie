"use client";

import { useState } from "react";
import { api } from "@/lib/trpc/client";
import { Input } from "@/components/ui/input";
import { cn, formatMoney } from "@/lib/utils";
import type { CostRow } from "@/components/expenses-table-columns";

export function CostContributionCell({
  costId,
  contributorId,
  contribution,
  isAdmin,
  monthId,
  budgieId,
  isCurrentUser,
}: {
  costId: string;
  contributorId: string;
  contribution: CostRow["contributions"][number] | undefined;
  isAdmin: boolean;
  monthId: string;
  budgieId: string;
  isCurrentUser?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("0");
  const utils = api.useUtils();
  const setAmountMutation = api.contribution.setAmount.useMutation({
    onSuccess: () => {
      void utils.cost.listForMonth.invalidate({ monthId, budgieId });
    },
  });
  const upsertAmountMutation = api.contribution.upsertAmount.useMutation({
    onSuccess: () => {
      void utils.cost.listForMonth.invalidate({ monthId, budgieId });
    },
  });

  const amount = contribution ? contribution.amount : 0;

  const handleEnterEdit = () => {
    setDraft(String(amount));
    setEditing(true);
  };

  const handleSave = async () => {
    const v = parseFloat(draft);
    if (!Number.isNaN(v) && v >= 0) {
      if (contribution) {
        await setAmountMutation.mutateAsync({
          costId,
          contributionId: contribution.id,
          amount: v,
        });
      } else {
        await upsertAmountMutation.mutateAsync({
          costId,
          contributorId,
          amount: v,
        });
      }
      setEditing(false);
    }
  };

  if (isAdmin && editing) {
    return (
      <Input
        type="number"
        min={0}
        step={0.01}
        className="h-8 w-24 text-right font-mono ml-auto"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => void handleSave()}
        onKeyDown={(e) => e.key === "Enter" && void handleSave()}
        autoFocus
      />
    );
  }

  return isAdmin ? (
    <button
      type="button"
      className={cn(
        "cursor-pointer hover:underline !text-base sm:!text-2xl text-right font-zain block w-full",
        isCurrentUser && "text-primary font-semibold"
      )}
      onClick={handleEnterEdit}
    >
      {formatMoney(amount)}
    </button>
  ) : (
    <span
      className={cn(
        "font-mono !text-base sm:!text-2xl block text-right",
        isCurrentUser && "text-primary font-semibold"
      )}
    >
      {formatMoney(amount)}
    </span>
  );
}
