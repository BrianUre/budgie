"use client";

import { api } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface CategoryMultiSelectProps {
  budgieId: string;
  value: string[];
  onValueChange: (categoryIds: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function CategoryMultiSelect({
  budgieId,
  value,
  onValueChange,
  disabled = false,
  placeholder = "Categories",
  className,
}: CategoryMultiSelectProps) {
  const { data: categories = [], isLoading } = api.category.list.useQuery(
    { budgieId },
    { enabled: !!budgieId }
  );

  const selectedCategories = categories.filter((c) => value.includes(c.id));

  const toggle = (categoryId: string) => {
    if (value.includes(categoryId)) {
      onValueChange(value.filter((id) => id !== categoryId));
    } else {
      onValueChange([...value, categoryId]);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || isLoading}
          className={cn(
            "h-9 justify-start gap-2 px-3 font-normal",
            selectedCategories.length === 0 && "text-muted-foreground",
            className
          )}
        >
          {selectedCategories.length === 0 ? (
            <span>{placeholder}</span>
          ) : (
            <div className="flex items-center gap-1.5 overflow-hidden">
              <div className="flex -space-x-1">
                {selectedCategories.slice(0, 3).map((c) => (
                  <span
                    key={c.id}
                    className="inline-block h-3 w-3 rounded-full border border-background"
                    style={{ backgroundColor: c.color }}
                    aria-hidden
                  />
                ))}
              </div>
              <span className="truncate">
                {selectedCategories.length <= 2
                  ? selectedCategories.map((c) => c.name).join(", ")
                  : `${selectedCategories[0]!.name}, ${selectedCategories[1]!.name} +${selectedCategories.length - 2}`}
              </span>
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="start">
        {categories.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">
            No categories yet.
          </p>
        ) : (
          <ul className="max-h-64 space-y-0.5 overflow-y-auto">
            {categories.map((category) => {
              const checked = value.includes(category.id);
              return (
                <li key={category.id}>
                  <label
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggle(category.id)}
                    />
                    <span
                      className="inline-block h-3 w-3 shrink-0 rounded-full border"
                      style={{ backgroundColor: category.color }}
                      aria-hidden
                    />
                    <span className="truncate">{category.name}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
