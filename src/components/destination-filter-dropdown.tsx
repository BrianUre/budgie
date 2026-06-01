"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DestinationListItem } from "@/server/api/routers/destination";

interface DestinationFilterDropdownProps {
  destinations: DestinationListItem[];
  value: string | null;
  onValueChange: (destinationId: string | null) => void;
  disabled?: boolean;
  className?: string;
}

const ALL_VALUE = "__all__";
export const DESTINATION_NONE = "__none__";

export function DestinationFilterDropdown({
  destinations,
  value,
  onValueChange,
  disabled = false,
  className,
}: DestinationFilterDropdownProps) {
  const displayValue = value ?? ALL_VALUE;

  return (
    <Select
      value={displayValue}
      onValueChange={(v) => onValueChange(v === ALL_VALUE ? null : v)}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder="All destinations" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_VALUE}>All destinations</SelectItem>
        {destinations.map((destination) => (
          <SelectItem key={destination.id} value={destination.id}>
            {destination.name}
          </SelectItem>
        ))}
        <SelectItem value={DESTINATION_NONE}>No destination</SelectItem>
      </SelectContent>
    </Select>
  );
}
