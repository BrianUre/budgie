"use client";

import { useState } from "react";
import { api } from "@/lib/trpc/client";
import { Input } from "@/components/ui/input";
import { cn, formatMoney } from "@/lib/utils";

type Contribution = {
  id: string;
  costId: string;
  contributorId: string;
  percentage: unknown;
};

export function ContributionCell({
  costId,
  costAmount,
  contribution,
  isAdmin,
  monthId,
  budgieId,
  isCurrentUser,
}: {
  costId: string;
  costAmount: number;
  contribution: Contribution | undefined;
  isAdmin: boolean;
  monthId: string;
  budgieId: string;
  isCurrentUser?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draftPercentage, setDraftPercentage] = useState(0);
  const utils = api.useUtils();
  const setPercentageMutation = api.contribution.setPercentage.useMutation({
    onSuccess: () => {
      void utils.contribution.listForMonth.invalidate({ monthId });
      void utils.cost.listForMonth.invalidate({ monthId, budgieId });
    },
  });

  const percentage = contribution ? Number(contribution.percentage) : 0;
  const amount = costAmount * (percentage / 100);
  const draftAmount = costAmount * (draftPercentage / 100);

  const handleEnterEdit = () => {
    setDraftPercentage(percentage);
    setEditing(true);
  };

  const handleSave = async () => {
    const p = draftPercentage;
    if (!Number.isNaN(p) && p >= 0 && p <= 100 && contribution) {
      await setPercentageMutation.mutateAsync({
        costId,
        contributionId: contribution.id,
        percentage: p,
      });
      setEditing(false);
    }
  };

  const handleAmountChange = (raw: string) => {
    const parsed = parseFloat(raw);
    if (Number.isNaN(parsed) || costAmount <= 0) return;
    const p = (parsed / costAmount) * 100;
    setDraftPercentage(Math.min(100, Math.max(0, p)));
  };

  if (isAdmin && editing) {
    return (
      <div className="flex flex-col items-end gap-2">
        <Input
          type="number"
          min={0}
          max={100}
          step={0.5}
          className="h-8 w-20 text-right"
          value={draftPercentage}
          onChange={(e) => setDraftPercentage(parseFloat(e.target.value) || 0)}
          onBlur={() => void handleSave()}
          onKeyDown={(e) => e.key === "Enter" && void handleSave()}
        />
        <Input
          type="number"
          min={0}
          step={0.01}
          className="h-8 w-24 text-right font-mono"
          value={draftAmount}
          onChange={(e) => handleAmountChange(e.target.value)}
          onBlur={() => void handleSave()}
          onKeyDown={(e) => e.key === "Enter" && void handleSave()}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <span
        className={cn(
          "!text-sm sm:text-sm",
          "text-muted-foreground",
          isCurrentUser && "font-semibold text-secondary"
        )}
      >
        {percentage}%
      </span>
      {isAdmin ? (
        <button
          type="button"
          className={cn(
            "cursor-pointer hover:underline !text-base sm:!text-2xl text-right font-zain",
            isCurrentUser && "text-primary font-semibold"
          )}
          onClick={handleEnterEdit}
        >
          {formatMoney(amount)}
        </button>
      ) : (
        <span
          className={cn(
            "font-mono !text-base sm:!text-2xl",
            isCurrentUser && "text-primary font-semibold"
          )}
        >
          {formatMoney(amount)}
        </span>
      )}
    </div>
  );
}
