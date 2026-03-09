"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { CreateNextMonthDialog } from "@/components/create-next-month-dialog";
import { formatMonth } from "@/lib/utils";
import { Trash2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

function firstDayOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export type MonthSelectorContentProps = {
  budgieId: string;
  months: { id: string; date: Date | string }[];
  selectedMonthId: string | null;
  onSelectMonth: (id: string) => void;
  isAdmin: boolean;
  onDeleteMonth: (monthId: string, monthLabel: string) => void;
  isDeleting: boolean;
};

function MonthSelectorDesktop({
  budgieId,
  months,
  selectedMonthId,
  onSelectMonth,
  isAdmin,
  onDeleteMonth,
  isDeleting: deleteMonthIsPending,
}: MonthSelectorContentProps) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);

  useEffect(() => {
    if (!carouselApi || !selectedMonthId || months.length === 0) return;
    const idx = months.findIndex((m) => m.id === selectedMonthId);
    if (idx >= 0) carouselApi.scrollTo(idx);
  }, [carouselApi, selectedMonthId, months]);

  return (
    <Card>
      <CardContent className="p-0">
        <Carousel
          opts={{ align: "start", loop: false }}
          setApi={setCarouselApi}
          className="mx-12"
        >
          <CarouselContent className="px-4">
            {months.map((month) => (
              <CarouselItem
                key={month.id}
                className={cn(
                  "basis-40 overflow-visible px-2 cursor-pointer transition-colors hover:bg-muted/50 group flex items-center justify-around",
                  selectedMonthId === month.id && "text-primary"
                )}
              >
                <span className="font-medium">
                  {formatMonth(new Date(month.date))}
                </span>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive invisible group-hover:visible"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteMonth(
                        month.id,
                        formatMonth(new Date(month.date))
                      );
                    }}
                    disabled={deleteMonthIsPending}
                    aria-label={`Delete ${formatMonth(new Date(month.date))}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
        <div className="flex items-center justify-center p-0">
          {isAdmin && (
            <CreateNextMonthDialog
              budgieId={budgieId}
              onSuccess={(newMonthId) => onSelectMonth(newMonthId)}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MonthSelectorMobile({
  budgieId,
  months,
  selectedMonthId,
  onSelectMonth,
  isAdmin,
  onDeleteMonth,
  isDeleting: deleteMonthIsPending,
}: MonthSelectorContentProps) {
  const [open, setOpen] = useState(false);
  const selectedMonth = months.find((m) => m.id === selectedMonthId);
  const selectedLabel = selectedMonth
    ? formatMonth(new Date(selectedMonth.date))
    : null;

  return (
    <Card>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <CardHeader className="flex flex-row items-center justify-between py-0 px-4 cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg">
            <CardTitle className="text-base sm:text-2xl">Month</CardTitle>
            <span className="flex items-center gap-2 font-medium text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {selectedLabel ?? "Select month"}
            </span>
          </CardHeader>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="flex flex-col gap-2 py-0">
            <DrawerTitle className="text-base sm:text-2xl">
              Select month
            </DrawerTitle>
            {isAdmin && (
              <CreateNextMonthDialog
                budgieId={budgieId}
                onSuccess={(newMonthId) => {
                  onSelectMonth(newMonthId);
                  setOpen(false);
                }}
              />
            )}
          </DrawerHeader>
          <ul className="max-h-[60vh] overflow-auto px-4 pb-4">
            {months.map((month) => (
              <li key={month.id}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-sm transition-colors hover:bg-muted/50",
                    selectedMonthId === month.id && "bg-muted text-primary"
                  )}
                  onClick={() => {
                    onSelectMonth(month.id);
                    setOpen(false);
                  }}
                >
                  <span className="font-medium">
                    {formatMonth(new Date(month.date))}
                  </span>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteMonth(
                          month.id,
                          formatMonth(new Date(month.date))
                        );
                      }}
                      disabled={deleteMonthIsPending}
                      aria-label={`Delete ${formatMonth(new Date(month.date))}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </DrawerContent>
      </Drawer>
    </Card>
  );
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
  const isMobile = useIsMobile();
  const utils = api.useUtils();
  const { data: months = [] } = api.month.list.useQuery(
    { budgieId },
    { enabled: !!budgieId }
  );

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

  const handleDelete = (monthId: string, monthLabel: string) => {
    if (
      !window.confirm(
        `Delete ${monthLabel}? This will remove all expenses and notes for that month.`
      )
    )
      return;
    deleteMonth.mutate({ monthId });
  };

  const contentProps: MonthSelectorContentProps = {
    budgieId,
    months,
    selectedMonthId,
    onSelectMonth,
    isAdmin,
    onDeleteMonth: handleDelete,
    isDeleting: deleteMonth.isPending,
  };

  return isMobile ? (
    <MonthSelectorMobile {...contentProps} />
  ) : (
    <MonthSelectorDesktop {...contentProps} />
  );
}
