"use client";

import { cn, formatMoney } from "@/lib/utils";
import type { BreakdownSeries } from "@/lib/statistics-chart-data";
import type { Currency } from "@/types/currency";

interface ChartSeriesLegendProps {
  series: BreakdownSeries[];
  currency: Currency;
  className?: string;
}

/**
 * Names every series and shows its total for the selected range, so identity
 * and magnitude are both readable as text rather than from color alone.
 *
 * Swatch colors come from the `--color-<seriesId>` variables emitted by
 * `ChartStyle`, which is why this has to render inside the same `data-chart`
 * scope as the chart it describes.
 */
export function ChartSeriesLegend({
  series,
  currency,
  className,
}: ChartSeriesLegendProps) {
  return (
    <ul
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-2 text-xs",
        className
      )}
    >
      {series.map((item) => (
        <li key={item.id} className="flex items-center gap-2">
          <span
            aria-hidden="true"
            // A short stroke mirrors the line the series is drawn with.
            className="h-0.5 w-3.5 shrink-0 rounded-[2px]"
            style={{ backgroundColor: `var(--color-${item.id})` }}
          />
          <span className="truncate text-muted-foreground">{item.label}</span>
          <span className="font-medium tabular-nums text-foreground">
            {formatMoney(item.total, currency)}
          </span>
        </li>
      ))}
    </ul>
  );
}
