import { DEFAULT_PAYMENT_STATUS } from "@/types/payment-status";

export function currentUtcMonthStart(now: Date = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

type DashboardCostLike = {
  amount: { toNumber(): number };
  paymentStatus: { status: string } | null | undefined;
};

export function summarizeDashboardCosts(costs: DashboardCostLike[]) {
  let total = 0;
  let settledCount = 0;
  for (const c of costs) {
    total += c.amount.toNumber();
    const status = c.paymentStatus?.status ?? DEFAULT_PAYMENT_STATUS;
    if (status === "paid" || status === "resolved") settledCount += 1;
  }
  const n = costs.length;
  return {
    currentMonthExpenseTotal: total,
    currentMonthPaidPercent: n === 0 ? 0 : Math.ceil((settledCount / n) * 100),
  };
}
