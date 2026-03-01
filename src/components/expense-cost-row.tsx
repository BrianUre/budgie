"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil } from "lucide-react";

function formatMoney(n: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(n);
}

function CostEdit({
  costId,
  value,
  onSave,
  isPending,
}: {
  costId: string;
  value: number;
  onSave: (v: number) => Promise<unknown>;
  isPending: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  const handleSave = async () => {
    const v = parseFloat(draft);
    if (!Number.isNaN(v) && v >= 0) {
      await onSave(v);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <span className="flex items-center gap-1">
        <Input
          type="number"
          min={0}
          step={0.01}
          className="h-8 w-24"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => e.key === "Enter" && void handleSave()}
        />
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={() => void handleSave()}
          disabled={isPending}
        >
          <Pencil className="h-3 w-3" />
        </Button>
      </span>
    );
  }
  return (
    <button
      type="button"
      className="flex items-center gap-1 hover:underline"
      onClick={() => {
        setDraft(String(value));
        setEditing(true);
      }}
    >
      {formatMoney(value)}
      <Pencil className="h-3 w-3 opacity-70" />
    </button>
  );
}

export function ExpenseCostRow({
  expense,
  cost,
  effectiveMonthId,
  isAdmin,
  onSaveCost,
  isCostPending,
}: {
  expense: { id: string; name: string };
  cost: { id: string; amount: unknown };
  effectiveMonthId: string | null;
  isAdmin: boolean;
  onSaveCost: (costId: string, amount: number) => Promise<unknown>;
  isCostPending: boolean;
}) {
  const amount = Number(cost.amount);

  return (
    <li className="flex items-center justify-between rounded border p-2">
      <span>{expense.name}</span>
      {effectiveMonthId && (
        <span className="font-mono b-dev">
          {isAdmin ? (
            <CostEdit
              costId={cost.id}
              value={amount}
              onSave={(v) => onSaveCost(cost.id, v)}
              isPending={isCostPending}
            />
          ) : (
            formatMoney(amount)
          )}
        </span>
      )}
    </li>
  );
}
