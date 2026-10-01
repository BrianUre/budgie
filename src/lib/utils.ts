import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMonth(date: Date) {
  const monthName = new Intl.DateTimeFormat(undefined, {
    month: "short",
  }).format(date);
  return `${monthName} ${date.getFullYear()}`;
}

export function formatMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(amount);
}

/** Short form for axis ticks, where a full currency string is too wide. */
export function formatCompactMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}
