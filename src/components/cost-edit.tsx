"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/utils";

export function CostEdit({
  value,
  onSave,
  isPending,
}: {
  value: number;
  onSave: (v: number) => Promise<unknown>;
  isPending: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    const v = parseFloat(draft);
    if (!Number.isNaN(v) && v >= 0) {
      await onSave(v);
      setEditing(false);
    }
  };

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  if (editing) {
    return (
      <div className="text-right">
        <Input
          ref={inputRef}
          type="number"
          min={0}
          step={0.01}
          className="h-8 w-24 text-base sm:text-2xl"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => void handleSave()}
          onKeyDown={(e) => e.key === "Enter" && void handleSave()}
        />
      </div>
    );
  }
  return (
    <div className="text-right text-tertiary">
      <button
        type="button"
        className="cursor-pointer hover:underline text-base sm:text-2xl font-zain"
        onClick={() => {
          setDraft(String(value));
          setEditing(true);
        }}
      >
        {formatMoney(value)}
      </button>
    </div>
  );
}
