export type SeriesColor = {
  light: string;
  dark: string;
};

/**
 * Categorical palette for chart series. Slots are handed out in this fixed
 * order and never cycled — the ordering is what keeps adjacent series apart
 * for color-vision-deficient readers, so do not reorder it. Each slot has its
 * own step for the dark surface rather than reusing the light one.
 */
export const CATEGORICAL_SERIES_COLORS: SeriesColor[] = [
  { light: "#2a78d6", dark: "#3987e5" },
  { light: "#eb6834", dark: "#d95926" },
  { light: "#1baf7a", dark: "#199e70" },
  { light: "#eda100", dark: "#c98500" },
  { light: "#e87ba4", dark: "#d55181" },
  { light: "#008300", dark: "#008300" },
  { light: "#4a3aa7", dark: "#9085e9" },
  { light: "#e34948", dark: "#e66767" },
];

/** Used for the folded tail once a breakdown exceeds the palette. */
export const OTHER_SERIES_COLOR: SeriesColor = {
  light: "#898781",
  dark: "#898781",
};

/** Single-series color for the headline total, in the app's primary green. */
export const TOTAL_SERIES_COLOR: SeriesColor = {
  light: "#166534",
  dark: "#22c55e",
};
