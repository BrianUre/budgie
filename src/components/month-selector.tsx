"use client";

import { useEffect } from "react";
import { api } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatMonth } from "@/lib/utils";

export function MonthSelector({
  budgieId,
  selectedMonthId,
  onSelectMonth,
}: {
  budgieId: string;
  selectedMonthId: string | null;
  onSelectMonth: (id: string) => void;
}) {
  const { data: months = [] } = api.month.list.useQuery(
    { budgieId },
    { enabled: !!budgieId }
  );

  useEffect(() => {
    if (months.length > 0 && selectedMonthId === null) {
      onSelectMonth(months[0]!.id);
    }
  }, [months, selectedMonthId, onSelectMonth]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Month</CardTitle>
        <CardDescription>
          Select the month to view and edit.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {months.map((month) => (
          <Button
            key={month.id}
            variant={selectedMonthId === month.id ? "default" : "outline"}
            size="sm"
            onClick={() => onSelectMonth(month.id)}
          >
            {formatMonth(new Date(month.date))}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
