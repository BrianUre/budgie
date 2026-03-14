"use client";

import { PaymentStatusType } from "@/types/payment-status";
import React from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

type PaymentStatusSelectorProps = {
  value: PaymentStatusType;
  onChange: (status: PaymentStatusType) => void;
  className?: string;
  disabled?: boolean;
};

// export function getPaymentStatusRowClass(status: PaymentStatusType): string {
//   return STATUS_ROW_CLASSES[status];
// }

export function PaymentStatusSelector({
  value,
  onChange,
  className,
  disabled,
}: PaymentStatusSelectorProps) {
  const statusOptions: PaymentStatusType[] = ["pending", "sent", "paid", "resolved"]
  return (
    <div className={cn("inline-flex gap-1", className)}>
      {statusOptions.map((status) => {
        const isActive = status === value;
        return (
          <Button
            key={status}
            type="button"
            className={cn(
              "px-2 text-xs",
              !isActive && "opacity-70",
            )}
            disabled={disabled}
            onClick={() => {
              if (!isActive && !disabled) {
                onChange(status);
              }
            }}
          >
            {status}
          </Button>
        );
      })}
    </div>
  );
}
