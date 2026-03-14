"use client";

import { PaymentStatusType } from "@/types/payment-status";
import React from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { Check, CheckCircle, Clock, LucideIcon, Send } from "lucide-react";

type PaymentStatusSelectorProps = {
  value: PaymentStatusType;
  onChange: (status: PaymentStatusType) => void;
  className?: string;
  disabled?: boolean;
};

const statusOptions: {
  status: PaymentStatusType,
  icon: LucideIcon,
  className: string
}[] = [
  {
    status: "pending",
    icon: Clock,
    className: "text-red-400",
  },
  {
    status: "sent",
    icon: Send,
    className: "text-yellow-500",
  },
  {
    status: "paid",
    icon: Check,
    className: "text-emerald-500",
  },
  {
    status: "resolved",
    icon: CheckCircle,
    className: "text-sky-500",
  },
];

export function PaymentStatusSelector({
  value,
  onChange,
  className,
  disabled,
}: PaymentStatusSelectorProps) {
  const selectedStatus = statusOptions.find(({ status }) => status === value);
  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      {statusOptions.map(({ status, icon, className }) => {
        const isActive = status === value;
        return (
          <Button
            key={status}
            type="button"
            variant="ghost"
            className={cn(
              "text-base font-light",
              isActive && "font-black",
              isActive && className
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
      {selectedStatus && (
        <div className="w-12 flex justify-end items-center">
          <selectedStatus.icon className={selectedStatus.className} />
        </div>
      )}
    </div>
  );
}
