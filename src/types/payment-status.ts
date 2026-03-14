import { z } from "zod";

export const DEFAULT_PAYMENT_STATUS: PaymentStatusType = "pending";
export type PaymentStatusType = "pending" | "sent" | "paid" | "resolved";

export const paymentStatusSchema = z.enum([
  "pending",
  "sent",
  "paid",
  "resolved",
]);

