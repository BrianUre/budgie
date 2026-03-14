"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { api } from "@/lib/trpc/client";
import {
  PaymentStatusSelector,
} from "@/components/payment-status-selector";
import type { PaymentStatusType } from "@/types/payment-status";

/**
 * Row shape for the expenses table: cost id, amount, expense name, and current payment status.
 */
export type PaymentStatusSectionRow = {
  id: string;
  amount: unknown;
  expenseName: string;
  paymentStatusValue: PaymentStatusType;
};

interface PaymentStatusSectionProps {
  /** Costs for the selected month with status and expense name resolved. */
  costsWithStatus: PaymentStatusSectionRow[];
  isAdmin: boolean;
  budgieId: string;
  monthId: string;
}

/**
 * Renders the "Expenses this month" card: a table of name, amount, and status
 * with a one-click status selector per row. Row background reflects current status.
 */
export function PaymentStatusSection({
  costsWithStatus,
  isAdmin,
  budgieId,
  monthId,
}: PaymentStatusSectionProps) {
  const utils = api.useUtils();
  const updateStatusMutation = api.cost.updatePaymentStatus.useMutation({
    onSuccess: () => {
      void utils.cost.listForMonth.invalidate({
        monthId,
        budgieId,
      });
    },
  });

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Expenses this month</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/2">Name</TableHead>
              <TableHead className="w-1/4 text-right">Amount</TableHead>
              <TableHead className="w-1/4 text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {costsWithStatus.map((cost) => (
              <TableRow
                key={cost.id}
                className={cn(
                  "transition-colors"
                )}
              >
                <TableCell className="font-medium">
                  {cost.expenseName}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatMoney(Number(cost.amount))}
                </TableCell>
                <TableCell className="text-right">
                  <PaymentStatusSelector
                    value={cost.paymentStatusValue}
                    disabled={!isAdmin}
                    onChange={(nextStatus) => {
                      if (!isAdmin) return;
                      updateStatusMutation.mutate({
                        costId: cost.id,
                        status: nextStatus,
                        budgieId,
                      });
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
