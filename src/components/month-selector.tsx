'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/trpc/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { CreateNextMonthDialog } from '@/components/create-next-month-dialog';
import { DeleteMonthDialog } from '@/components/delete-month-dialog';
import { formatMonth } from '@/lib/utils';
import { Calendar, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

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
};

function MonthSelectorDesktop({
  budgieId,
  months,
  selectedMonthId,
  onSelectMonth,
  isAdmin,
}: MonthSelectorContentProps) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);

  useEffect(() => {
    if (!carouselApi || !selectedMonthId || months.length === 0) return;
    const idx = months.findIndex((m) => m.id === selectedMonthId);
    if (idx >= 0) carouselApi.scrollTo(idx);
  }, [carouselApi, selectedMonthId, months]);

  return (
    <section className='flex flex-col gap-2'>
      <div>
        <CardContent className="p-0">
          <Carousel
            opts={{ align: 'start', loop: false, watchDrag: false }}
            setApi={setCarouselApi}
            className="mx-12 py-2"
          >
            <CarouselContent className="px-4 !gap-0">
              {months.map((month) => (
                <CarouselItem
                  key={month.id}
                  className={cn(
                    'basis-48 overflow-visible px-2 cursor-pointer hover:text-primary-hover flex items-center justify-around hover:bg-muted/50',
                    // selectedMonthId === month.id && 'text-primary',
                  )}
                  onClick={() => onSelectMonth(month.id)}
                >
                  <span className="font-medium flex items-center gap-2">
                    <CalendarDays
                      className={cn(
                        'h-4 w-4 group-hover:text-secondary-hover',
                        selectedMonthId === month.id && 'text-secondary',
                      )}
                    />
                    {formatMonth(new Date(month.date))}
                  </span>
                  {isAdmin && (
                    <DeleteMonthDialog
                      monthId={month.id}
                      monthLabel={formatMonth(new Date(month.date))}
                      budgieId={budgieId}
                      months={months}
                      selectedMonthId={selectedMonthId}
                      onSelectMonth={onSelectMonth}
                      triggerClassName="invisible group-hover:visible !bg-none"
                    />
                  )}
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </CardContent>
      </div>
      <div className="flex items-center justify-center p-0">
        {isAdmin && (
          <CreateNextMonthDialog
            budgieId={budgieId}
            onSuccess={(newMonthId) => onSelectMonth(newMonthId)}
          />
        )}
      </div>
    </section>
  );
}

function MonthSelectorMobile({
  budgieId,
  months,
  selectedMonthId,
  onSelectMonth,
  isAdmin,
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
              {selectedLabel ?? 'Select month'}
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
                    'flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-sm transition-colors hover:bg-muted/50',
                    selectedMonthId === month.id && 'bg-muted text-primary',
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
                    <DeleteMonthDialog
                      monthId={month.id}
                      monthLabel={formatMonth(new Date(month.date))}
                      budgieId={budgieId}
                      months={months}
                      selectedMonthId={selectedMonthId}
                      onSelectMonth={onSelectMonth}
                    />
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
  const { data: months = [] } = api.month.list.useQuery(
    { budgieId },
    { enabled: !!budgieId },
  );

  // Prefer current month for initial selection; fallback to first (latest)
  useEffect(() => {
    if (months.length > 0 && selectedMonthId === null) {
      const current = firstDayOfMonth(new Date());
      const currentMonth = months.find((m) =>
        isSameMonth(new Date(m.date), current),
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
          isSameMonth(new Date(m.date), current),
        );
        onSelectMonth(currentMonth?.id ?? months[0]!.id);
      }
    }
  }, [months, selectedMonthId, onSelectMonth]);

  const contentProps: MonthSelectorContentProps = {
    budgieId,
    months,
    selectedMonthId,
    onSelectMonth,
    isAdmin,
  };

  return isMobile ? (
    <MonthSelectorMobile {...contentProps} />
  ) : (
    <MonthSelectorDesktop {...contentProps} />
  );
}
