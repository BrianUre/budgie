"use client";

import { api } from "@/lib/trpc/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CategoryFilterDropdownProps {
  budgieId: string;
  value: string | null;
  onValueChange: (categoryId: string | null) => void;
  disabled?: boolean;
  className?: string;
}

const ALL_VALUE = "__all__";

export function CategoryFilterDropdown({
  budgieId,
  value,
  onValueChange,
  disabled = false,
  className,
}: CategoryFilterDropdownProps) {
  const { data: categories = [], isLoading } = api.category.list.useQuery(
    { budgieId },
    { enabled: !!budgieId }
  );

  const displayValue = value ?? ALL_VALUE;

  return (
    <Select
      value={displayValue}
      onValueChange={(v) => onValueChange(v === ALL_VALUE ? null : v)}
      disabled={disabled || isLoading}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder="All categories" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_VALUE}>All categories</SelectItem>
        {categories.map((category) => (
          <SelectItem key={category.id} value={category.id}>
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-full border"
                style={{ backgroundColor: category.color }}
                aria-hidden
              />
              <span>{category.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
