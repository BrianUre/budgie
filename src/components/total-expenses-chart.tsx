"use client";

import { useId } from "react";
import { Area, AreaChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { TOTAL_SERIES_COLOR } from "@/lib/chart-colors";
import { formatCompactMoney, formatMoney } from "@/lib/utils";
import {
  buildValueAxisScale,
  type TotalChartRow,
} from "@/lib/statistics-chart-data";
import type { Currency } from "@/types/currency";

interface TotalExpensesChartProps {
  rows: TotalChartRow[];
  currency: Currency;
}

const chartConfig: ChartConfig = {
  total: {
    label: "Total expenses",
    theme: { light: TOTAL_SERIES_COLOR.light, dark: TOTAL_SERIES_COLOR.dark },
  },
};

export function TotalExpensesChart({ rows, currency }: TotalExpensesChartProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const gradientId = useId().replace(/:/g, "");
  const rangeTotal = rows.reduce((sum, row) => sum + row.total, 0);
  const monthlyAverage = rows.length === 0 ? 0 : rangeTotal / rows.length;
  const lastRowIndex = rows.length - 1;
  const valueAxis = buildValueAxisScale(
    Math.max(0, ...rows.map((row) => row.total))
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base sm:text-xl font-zain font-medium">
          Total expenses
        </CardTitle>
        <CardDescription>
          {formatMoney(rangeTotal, currency)} across {rows.length}{" "}
          {rows.length === 1 ? "month" : "months"} ·{" "}
          {formatMoney(monthlyAverage, currency)} per month on average
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[240px] w-full"
        >
          <AreaChart
            accessibilityLayer
            data={rows}
            margin={{ top: 20, right: 16, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--color-total)"
                  stopOpacity={0.14}
                />
                <stop
                  offset="100%"
                  stopColor="var(--color-total)"
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="monthLabel"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={16}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={64}
              domain={valueAxis.domain}
              ticks={valueAxis.ticks}
              tickFormatter={(value: number) =>
                formatCompactMoney(value, currency)
              }
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  indicator="line"
                  formatter={(value) => (
                    <div className="flex flex-1 items-center justify-between gap-3 leading-none">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-medium tabular-nums text-foreground">
                        {formatMoney(Number(value), currency)}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Area
              dataKey="total"
              type="linear"
              stroke="var(--color-total)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--card))" }}
              isAnimationActive={!prefersReducedMotion}
            >
              {/* Only the last point is labelled — a value on every point goes unread. */}
              <LabelList
                dataKey="total"
                content={(props) => {
                  const { x, y, value, index } = props as {
                    x?: number;
                    y?: number;
                    value?: number;
                    index?: number;
                  };
                  if (
                    index !== lastRowIndex ||
                    x == null ||
                    y == null ||
                    value == null
                  ) {
                    return null;
                  }
                  return (
                    <text
                      x={x}
                      y={y - 10}
                      textAnchor="end"
                      className="fill-foreground text-xs font-medium"
                    >
                      {formatMoney(value, currency)}
                    </text>
                  );
                }}
              />
            </Area>
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
