"use client";

import { api } from "@/lib/trpc/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DestinationDropdownProps {
  budgieId: string;
  value: string | null;
  onValueChange: (destinationId: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function DestinationDropdown({
  budgieId,
  value,
  onValueChange,
  disabled = false,
  placeholder = "Destination",
  className,
}: DestinationDropdownProps) {
  const { data: destinations = [], isLoading } = api.destination.list.useQuery(
    { budgieId },
    { enabled: !!budgieId }
  );

  const noneValue = "__none__";
  const displayValue = value ?? noneValue;

  return (
    <Select
      value={displayValue}
      onValueChange={(v) => onValueChange(v === noneValue ? null : v)}
      disabled={disabled || isLoading}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={noneValue}>
          No destination
        </SelectItem>
        {destinations.map((d) => (
          <SelectItem key={d.id} value={d.id}>
            {d.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
