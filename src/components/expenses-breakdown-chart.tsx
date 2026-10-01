"use client";

import { useId, useMemo } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ChartSeriesLegend } from "@/components/chart-series-legend";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { formatCompactMoney, formatMoney } from "@/lib/utils";
import {
  buildValueAxisScale,
  maximumBreakdownValue,
  type BreakdownChartData,
} from "@/lib/statistics-chart-data";
import type { Currency } from "@/types/currency";

interface ExpensesBreakdownChartProps {
  title: string;
  description: string;
  data: BreakdownChartData;
  currency: Currency;
  emptyMessage: string;
}

/**
 * One line per series over the selected months. Every series is drawn against
 * the same baseline so each one reads as its own trend over time rather than
 * as a share of the month.
 */
export function ExpensesBreakdownChart({
  title,
  description,
  data,
  currency,
  emptyMessage,
}: ExpensesBreakdownChartProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  // The legend sits outside ChartContainer, so this scope owns the series
  // color variables that both of them read.
  const chartId = `chart-${useId().replace(/:/g, "")}`;

  const chartConfig = useMemo<ChartConfig>(
    () =>
      Object.fromEntries(
        data.series.map((item) => [
          item.id,
          {
            label: item.label,
            theme: { light: item.color.light, dark: item.color.dark },
          },
        ])
      ),
    [data.series]
  );

  const labelsBySeriesId = useMemo(
    () => new Map(data.series.map((item) => [item.id, item.label])),
    [data.series]
  );

  const valueAxis = useMemo(
    () =>
      buildValueAxisScale(
        maximumBreakdownValue({ rows: data.rows, series: data.series })
      ),
    [data.rows, data.series]
  );

  return (
    <Card data-chart={chartId}>
      <ChartStyle id={chartId} config={chartConfig} />
      <CardHeader className="pb-2">
        <CardTitle className="text-base sm:text-xl font-zain font-medium">
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.series.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </p>
        ) : (
          <>
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[240px] w-full"
            >
              <LineChart
                accessibilityLayer
                data={data.rows}
                margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
              >
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
                      formatter={(value, name) => (
                        <>
                          <span
                            aria-hidden="true"
                            className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                            style={{
                              backgroundColor: `var(--color-${String(name)})`,
                            }}
                          />
                          <div className="flex flex-1 items-center justify-between gap-3 leading-none">
                            <span className="text-muted-foreground">
                              {labelsBySeriesId.get(String(name)) ??
                                String(name)}
                            </span>
                            <span className="font-medium tabular-nums text-foreground">
                              {formatMoney(Number(value), currency)}
                            </span>
                          </div>
                        </>
                      )}
                    />
                  }
                />
                {data.series.map((item) => (
                  <Line
                    key={item.id}
                    dataKey={item.id}
                    type="linear"
                    stroke={`var(--color-${item.id})`}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    dot={false}
                    activeDot={{
                      r: 4,
                      strokeWidth: 2,
                      stroke: "hsl(var(--card))",
                    }}
                    isAnimationActive={!prefersReducedMotion}
                  />
                ))}
              </LineChart>
            </ChartContainer>
            <ChartSeriesLegend series={data.series} currency={currency} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
