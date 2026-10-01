import { z } from "zod";

/** Bucket for costs that have no destination assigned. */
export const UNASSIGNED_DESTINATION_ID = "__unassigned_destination__";

/** Bucket for costs that carry no category. */
export const UNCATEGORIZED_ID = "__uncategorized__";

export const statisticsRangeSchema = z.enum(["6", "12", "24", "all"]);

export type StatisticsRange = z.infer<typeof statisticsRangeSchema>;

export const DEFAULT_STATISTICS_RANGE: StatisticsRange = "12";

export const STATISTICS_RANGE_OPTIONS: {
  value: StatisticsRange;
  label: string;
}[] = [
  { value: "6", label: "Last 6 months" },
  { value: "12", label: "Last 12 months" },
  { value: "24", label: "Last 24 months" },
  { value: "all", label: "All time" },
];

/** Months to request for a range; null means every month on record. */
export function monthCountForRange(range: StatisticsRange): number | null {
  if (range === "all") {
    return null;
  }
  return Number(range);
}
