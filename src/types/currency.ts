import { z } from "zod";

export const currencySchema = z.enum(["USD", "EUR"]);

export type Currency = z.infer<typeof currencySchema>;

export const DEFAULT_CURRENCY: Currency = "USD";

export const CURRENCY_OPTIONS: { value: Currency; label: string }[] = [
  { value: "USD", label: "US Dollar ($)" },
  { value: "EUR", label: "Euro (€)" },
];
