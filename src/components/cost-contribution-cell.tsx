"use client";

import { useState } from "react";
import { api } from "@/lib/trpc/client";
import { Input } from "@/components/ui/input";
import { cn, formatMoney } from "@/lib/utils";
import { useOptimisticCostListUpdate } from "@/hooks/use-optimistic-cost-list-update";
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
  const optimistic = useOptimisticCostListUpdate({ monthId, budgieId });
  const setAmountMutation = api.contribution.setAmount.useMutation({
    onMutate: (input) =>
      optimistic.apply((rows) =>
        rows.map((row) =>
          row.id === input.costId
            ? {
                ...row,
                contributions: row.contributions.map((c) =>
                  c.id === input.contributionId
                    ? { ...c, amount: input.amount }
                    : c
                ),
              }
            : row
        )
      ),
    onError: (_err, _vars, ctx) => optimistic.rollback(ctx?.snapshot),
  });
  const upsertAmountMutation = api.contribution.upsertAmount.useMutation({
    onMutate: (input) =>
      optimistic.apply((rows) =>
        rows.map((row) => {
          if (row.id !== input.costId) return row;
          const existing = row.contributions.find(
            (c) => c.contributorId === input.contributorId
          );
          if (existing) {
            return {
              ...row,
              contributions: row.contributions.map((c) =>
                c.contributorId === input.contributorId
                  ? { ...c, amount: input.amount }
                  : c
              ),
            };
          }
          const now = new Date();
          return {
            ...row,
            contributions: [
              ...row.contributions,
              {
                id: `temp_${input.costId}_${input.contributorId}_${Date.now()}`,
                costId: input.costId,
                contributorId: input.contributorId,
                amount: input.amount,
                createdAt: now,
                updatedAt: now,
              },
            ],
          };
        })
      ),
    onError: (_err, _vars, ctx) => optimistic.rollback(ctx?.snapshot),
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
