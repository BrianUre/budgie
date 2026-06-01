"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ContributorListItem } from "@/server/api/routers/contributor";

interface ContributorFilterDropdownProps {
  contributors: ContributorListItem[];
  value: string | null;
  onValueChange: (contributorId: string | null) => void;
  disabled?: boolean;
  className?: string;
}

const ALL_VALUE = "__all__";

function displayName(contributor: ContributorListItem): string {
  return contributor.user?.name ?? contributor.user?.email ?? contributor.name ?? "—";
}

export function ContributorFilterDropdown({
  contributors,
  value,
  onValueChange,
  disabled = false,
  className,
}: ContributorFilterDropdownProps) {
  const displayValue = value ?? ALL_VALUE;

  return (
    <Select
      value={displayValue}
      onValueChange={(v) => onValueChange(v === ALL_VALUE ? null : v)}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder="All contributors" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_VALUE}>All contributors</SelectItem>
        {contributors.map((contributor) => (
          <SelectItem key={contributor.id} value={contributor.id}>
            {displayName(contributor)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
