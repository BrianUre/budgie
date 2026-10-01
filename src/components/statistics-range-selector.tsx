"use client";

import { CalendarRange } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  STATISTICS_RANGE_OPTIONS,
  statisticsRangeSchema,
  type StatisticsRange,
} from "@/types/statistics";

interface StatisticsRangeSelectorProps {
  value: StatisticsRange;
  onValueChange: (range: StatisticsRange) => void;
  disabled?: boolean;
  className?: string;
}

export function StatisticsRangeSelector({
  value,
  onValueChange,
  disabled = false,
  className,
}: StatisticsRangeSelectorProps) {
  return (
    <Select
      value={value}
      onValueChange={(next) => {
        const parsed = statisticsRangeSchema.safeParse(next);
        if (!parsed.success) {
          return;
        }
        onValueChange(parsed.data);
      }}
      disabled={disabled}
    >
      <SelectTrigger
        aria-label="Time range"
        className={cn("w-[190px] gap-2", className)}
      >
        <CalendarRange className="h-4 w-4 shrink-0 text-tertiary" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATISTICS_RANGE_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
