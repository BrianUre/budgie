"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { formatMonth } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

function firstDayOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function MonthSelector({
  budgieId,
  selectedMonthId,
  onSelectMonth,
  isAdmin = false,
}: {
  budgieId: string;
  selectedMonthId: string | null;
  onSelectMonth: (id: string) => void;
  isAdmin?: boolean;
}) {
  const utils = api.useUtils();
  const { data: months = [] } = api.month.list.useQuery(
    { budgieId },
    { enabled: !!budgieId }
  );

  const createNext = api.month.createNext.useMutation({
    onSuccess: (newMonth) => {
      void utils.month.list.invalidate({ budgieId });
      onSelectMonth(newMonth.id);
    },
  });

  const deleteMonth = api.month.delete.useMutation({
    onSuccess: (_data, variables) => {
      void utils.month.list.invalidate({ budgieId });
      if (selectedMonthId === variables.monthId) {
        const remaining = months.filter((m) => m.id !== variables.monthId);
        const current = firstDayOfMonth(new Date());
        const currentMonth = remaining.find((m) =>
          isSameMonth(new Date(m.date), current)
        );
        onSelectMonth(currentMonth?.id ?? remaining[0]?.id ?? null);
      }
    },
  });

  // Prefer current month for initial selection; fallback to first (latest)
  useEffect(() => {
    if (months.length > 0 && selectedMonthId === null) {
      const current = firstDayOfMonth(new Date());
      const currentMonth = months.find((m) =>
        isSameMonth(new Date(m.date), current)
      );
      onSelectMonth(currentMonth?.id ?? months[0]!.id);
    }
  }, [months, selectedMonthId, onSelectMonth]);

  // If selected month was deleted, pick another
  useEffect(() => {
    if (months.length > 0 && selectedMonthId !== null) {
      const exists = months.some((m) => m.id === selectedMonthId);
      if (!exists) {
        const current = firstDayOfMonth(new Date());
        const currentMonth = months.find((m) =>
          isSameMonth(new Date(m.date), current)
        );
        onSelectMonth(currentMonth?.id ?? months[0]!.id);
      }
    }
  }, [months, selectedMonthId, onSelectMonth]);

  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);

  useEffect(() => {
    if (!carouselApi || !selectedMonthId || months.length === 0) return;
    const idx = months.findIndex((m) => m.id === selectedMonthId);
    if (idx >= 0) carouselApi.scrollTo(idx);
  }, [carouselApi, selectedMonthId, months]);

  const handleDelete = (monthId: string, monthLabel: string) => {
    if (
      !window.confirm(
        `Delete ${monthLabel}? This will remove all expenses and notes for that month.`
      )
    )
      return;
    deleteMonth.mutate({ monthId });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Month</CardTitle>
          <CardDescription>Select the month to view and edit.</CardDescription>
        </div>
        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => createNext.mutate({ budgieId })}
            disabled={createNext.isPending}
          >
            <Plus className="h-4 w-4" />
            <span className="ml-2">Add next month</span>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Carousel
          opts={{ align: "start", loop: false }}
          setApi={setCarouselApi}
          className="mx-12"
        >
          <CarouselContent>
            {months.map((month) => (
              <CarouselItem
                key={month.id}
                className="basis-[180px] md:basis-[200px] overflow-visible"
              >
                <Card
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-muted/50",
                    selectedMonthId === month.id &&
                      "bg-muted"
                  )}
                  onClick={() => onSelectMonth(month.id)}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <span className="font-medium">
                      {formatMonth(new Date(month.date))}
                    </span>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructiv"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(
                            month.id,
                            formatMonth(new Date(month.date))
                          );
                        }}
                        disabled={deleteMonth.isPending}
                        aria-label={`Delete ${formatMonth(
                          new Date(month.date)
                        )}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </CardContent>
    </Card>
  );
}
