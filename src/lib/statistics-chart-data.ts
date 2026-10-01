import {
  CATEGORICAL_SERIES_COLORS,
  OTHER_SERIES_COLOR,
  type SeriesColor,
} from "@/lib/chart-colors";
import { formatMonth } from "@/lib/utils";
import type { MonthlyBreakdownPoint } from "@/server/api/routers/statistics";

/** Palette size; anything past this folds into a single "Other" series. */
export const MAXIMUM_BREAKDOWN_SERIES = CATEGORICAL_SERIES_COLORS.length;

export const OTHER_SERIES_ID = "__other__";

export type BreakdownEntity = {
  id: string;
  label: string;
  /** Entities that own a color elsewhere in the app (categories) keep it. */
  color?: SeriesColor | null;
};

export type BreakdownSeries = {
  id: string;
  label: string;
  color: SeriesColor;
  total: number;
};

export type BreakdownRow = Record<string, string | number> & {
  monthLabel: string;
};

export type BreakdownChartData = {
  series: BreakdownSeries[];
  rows: BreakdownRow[];
};

function sumTotals({
  points,
  selectAmounts,
}: {
  points: MonthlyBreakdownPoint[];
  selectAmounts: (point: MonthlyBreakdownPoint) => Record<string, number>;
}): Map<string, number> {
  const totals = new Map<string, number>();
  for (const point of points) {
    for (const [entityId, amount] of Object.entries(selectAmounts(point))) {
      totals.set(entityId, (totals.get(entityId) ?? 0) + amount);
    }
  }
  return totals;
}

function selectKeptEntityIds(
  entities: BreakdownEntity[],
  totals: Map<string, number>
): Set<string> {
  if (entities.length <= MAXIMUM_BREAKDOWN_SERIES) {
    return new Set(entities.map((entity) => entity.id));
  }

  const rankedByTotal = [...entities].sort(
    (a, b) => (totals.get(b.id) ?? 0) - (totals.get(a.id) ?? 0)
  );
  return new Set(
    rankedByTotal
      .slice(0, MAXIMUM_BREAKDOWN_SERIES - 1)
      .map((entity) => entity.id)
  );
}

/**
 * Turns monthly points into Recharts rows plus the series to draw.
 *
 * Entities keep the order they are passed in, and palette slots are handed out
 * in that order, so a series keeps its color no matter how its total ranks.
 * Entities that never received money are dropped, and anything past the palette
 * folds into "Other".
 */
export function buildBreakdownChartData({
  points,
  entities,
  selectAmounts,
}: {
  points: MonthlyBreakdownPoint[];
  entities: BreakdownEntity[];
  selectAmounts: (point: MonthlyBreakdownPoint) => Record<string, number>;
}): BreakdownChartData {
  const totals = sumTotals({ points, selectAmounts });
  const fundedEntities = entities.filter(
    (entity) => (totals.get(entity.id) ?? 0) > 0
  );
  const keptEntityIds = selectKeptEntityIds(fundedEntities, totals);

  const series: BreakdownSeries[] = [];
  let slotIndex = 0;
  for (const entity of fundedEntities) {
    if (!keptEntityIds.has(entity.id)) {
      continue;
    }
    const paletteColor =
      CATEGORICAL_SERIES_COLORS[slotIndex % MAXIMUM_BREAKDOWN_SERIES] ??
      OTHER_SERIES_COLOR;
    slotIndex += 1;
    series.push({
      id: entity.id,
      label: entity.label,
      color: entity.color ?? paletteColor,
      total: totals.get(entity.id) ?? 0,
    });
  }

  const foldedEntities = fundedEntities.filter(
    (entity) => !keptEntityIds.has(entity.id)
  );
  if (foldedEntities.length > 0) {
    series.push({
      id: OTHER_SERIES_ID,
      label: `Other (${foldedEntities.length})`,
      color: OTHER_SERIES_COLOR,
      total: foldedEntities.reduce(
        (sum, entity) => sum + (totals.get(entity.id) ?? 0),
        0
      ),
    });
  }

  const rows = points.map((point) => {
    const row: BreakdownRow = { monthLabel: formatMonth(new Date(point.date)) };
    for (const seriesItem of series) {
      row[seriesItem.id] = 0;
    }
    for (const [entityId, amount] of Object.entries(selectAmounts(point))) {
      const key = keptEntityIds.has(entityId) ? entityId : OTHER_SERIES_ID;
      if (!(key in row)) {
        continue;
      }
      row[key] = (row[key] as number) + amount;
    }
    return row;
  });

  return { series, rows };
}

export type TotalChartRow = {
  monthLabel: string;
  total: number;
};

export function buildTotalChartRows(
  points: MonthlyBreakdownPoint[]
): TotalChartRow[] {
  return points.map((point) => ({
    monthLabel: formatMonth(new Date(point.date)),
    total: point.total,
  }));
}

const NICE_STEP_MULTIPLIERS = [1, 2, 2.5, 5, 10];

export type ValueAxisScale = {
  domain: [number, number];
  ticks: number[];
};

/**
 * Recharts' default ticks land on values like 650 or 1,300. This rounds the
 * axis to 1/2/2.5/5 × 10ⁿ steps so every tick reads as a clean number.
 */
export function buildValueAxisScale(maximumValue: number): ValueAxisScale {
  if (maximumValue <= 0) {
    return { domain: [0, 1], ticks: [0, 1] };
  }

  const targetStepCount = 4;
  const magnitude = 10 ** Math.floor(Math.log10(maximumValue / targetStepCount));
  const multiplier =
    NICE_STEP_MULTIPLIERS.find(
      (candidate) => maximumValue / targetStepCount <= candidate * magnitude
    ) ?? 10;
  const step = multiplier * magnitude;
  const highestTick = Math.ceil(maximumValue / step) * step;

  const ticks: number[] = [];
  for (let tick = 0; tick <= highestTick + step / 2; tick += step) {
    ticks.push(Number(tick.toPrecision(12)));
  }

  return { domain: [0, highestTick], ticks };
}

/** Highest value any single series reaches, which the lines are scaled to. */
export function maximumBreakdownValue({
  rows,
  series,
}: {
  rows: BreakdownRow[];
  series: BreakdownSeries[];
}): number {
  let maximum = 0;
  for (const row of rows) {
    for (const item of series) {
      maximum = Math.max(maximum, Number(row[item.id] ?? 0));
    }
  }
  return maximum;
}
