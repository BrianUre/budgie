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
import { DEFAULT_PAYMENT_STATUS, type PaymentStatusType } from "@/types/payment-status";
import type { CostListForMonthItem } from "@/server/api/routers/cost";

interface PaymentStatusSectionProps {
  /** Costs for the selected month, used to render name, amount, and status. */
  costs: CostListForMonthItem[];
  isAdmin: boolean;
  budgieId: string;
  monthId: string;
}

/**
 * Renders the "Expenses this month" card: a table of name, amount, and status
 * with a one-click status selector per row.
 */
export function PaymentStatusSection({
  costs,
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
            {costs.map((cost) => (
              <TableRow
                key={cost.id}
                className={cn(
                  "transition-colors"
                )}
              >
                <TableCell className="font-medium">
                  {cost.expense.name}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatMoney(cost.amount)}
                </TableCell>
                <TableCell className="text-right">
                  <PaymentStatusSelector
                    value={(cost.paymentStatus?.status ?? DEFAULT_PAYMENT_STATUS) as PaymentStatusType}
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
