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

export function formatMoney(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(amount);
}
