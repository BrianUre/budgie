"use client";

import { useMemo, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
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
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { api } from "@/lib/trpc/client";
import { useOptimisticCostListUpdate } from "@/hooks/use-optimistic-cost-list-update";
import {
  buildPaymentStatusColumns,
  type PaymentStatusRow,
} from "@/components/payment-status-table-columns";
import type { CostListForMonthItem } from "@/server/api/routers/cost";
import { useBudgieDetail } from "@/app/budgie/[id]/budgie-detail-context";

interface PaymentStatusSectionProps {
  /** Costs for the selected month, used to render name, destination, amount, and status. */
  costs: CostListForMonthItem[];
  selectedContributorId?: string | null;
  isAdmin: boolean;
  budgieId: string;
  monthId: string;
  /** True while costs are being fetched; the table body renders skeleton rows. */
  isLoading?: boolean;
}

// Varied widths keep the placeholder rows looking like real data instead of
// uniform bars. Deterministic so server and client render identically.
const SKELETON_ROWS = [
  { name: "w-36", destination: "w-24", amount: "w-16" },
  { name: "w-24", destination: "w-28", amount: "w-12" },
  { name: "w-44", destination: "w-20", amount: "w-14" },
  { name: "w-28", destination: "w-24", amount: "w-16" },
] as const;

function PaymentStatusSkeletonRows() {
  return (
    <>
      {SKELETON_ROWS.map((widths, index) => (
        <TableRow key={index} className="hover:bg-transparent">
          <TableCell>
            <Skeleton
              className={cn(
                "h-5 motion-reduce:animate-none",
                widths.name
              )}
            />
          </TableCell>
          <TableCell>
            <Skeleton
              className={cn(
                "h-5 motion-reduce:animate-none",
                widths.destination
              )}
            />
          </TableCell>
          <TableCell>
            <Skeleton
              className={cn(
                "ml-auto h-5 motion-reduce:animate-none",
                widths.amount
              )}
            />
          </TableCell>
          {/* Matches the h-10 status selector so row height is identical once data lands. */}
          <TableCell>
            <div className="flex h-10 items-center justify-end gap-1">
              <Skeleton className="h-6 w-16 rounded-full motion-reduce:animate-none" />
              <Skeleton className="h-6 w-10 rounded-full motion-reduce:animate-none" />
              <Skeleton className="h-6 w-10 rounded-full motion-reduce:animate-none" />
              <Skeleton className="h-6 w-16 rounded-full motion-reduce:animate-none" />
              <div className="flex w-12 justify-end">
                <Skeleton className="h-6 w-6 rounded-full motion-reduce:animate-none" />
              </div>
            </div>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function PaymentStatusSection({
  costs,
  selectedContributorId,
  isAdmin,
  budgieId,
  monthId,
  isLoading = false,
}: PaymentStatusSectionProps) {
  const { currency } = useBudgieDetail();
  const optimistic = useOptimisticCostListUpdate({ monthId, budgieId });
  const updateStatusMutation = api.cost.updatePaymentStatus.useMutation({
    onMutate: (input) =>
      optimistic.apply((rows) =>
        rows.map((row) => {
          if (row.id !== input.costId) return row;
          if (!row.paymentStatus) return row;
          return {
            ...row,
            paymentStatus: {
              ...row.paymentStatus,
              status: input.status,
              updatedAt: new Date(),
            },
          };
        })
      ),
    onError: (_err, _vars, ctx) => optimistic.rollback(ctx?.snapshot),
  });

  const [sorting, setSorting] = useState<SortingState>([
    { id: "name", desc: false },
  ]);

  const columnHelper = createColumnHelper<PaymentStatusRow>();
  const columns = useMemo(
    () =>
      buildPaymentStatusColumns({
        columnHelper,
        isAdmin,
        budgieId,
        selectedContributorId,
        updateStatusMutation,
        currency,
      }),
    [columnHelper, isAdmin, budgieId, selectedContributorId, updateStatusMutation, currency]
  );

  const table = useReactTable({
    data: costs,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const columnAlign: Record<string, "left" | "right"> = {
    name: "left",
    destination: "left",
    amount: "right",
    status: "right",
  };

  const columnWidth: Record<string, string> = {
    name: "w-[35%]",
    destination: "w-[25%]",
    amount: "w-[20%]",
    status: "w-[20%]",
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Expenses this month</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const align = columnAlign[header.column.id] ?? "left";
                  const width = columnWidth[header.column.id];
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        width,
                        align === "right" && "text-right"
                      )}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading && <PaymentStatusSkeletonRows />}
            {!isLoading && table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="transition-colors">
                {row.getVisibleCells().map((cell) => {
                  const align = columnAlign[cell.column.id] ?? "left";
                  return (
                    <TableCell
                      key={cell.id}
                      className={cn(align === "right" && "text-right")}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
