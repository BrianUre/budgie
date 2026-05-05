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
import { cn } from "@/lib/utils";
import { api } from "@/lib/trpc/client";
import {
  buildPaymentStatusColumns,
  type PaymentStatusRow,
} from "@/components/payment-status-table-columns";
import type { CostListForMonthItem } from "@/server/api/routers/cost";

interface PaymentStatusSectionProps {
  /** Costs for the selected month, used to render name, destination, amount, and status. */
  costs: CostListForMonthItem[];
  isAdmin: boolean;
  budgieId: string;
  monthId: string;
}

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
        updateStatusMutation,
      }),
    [columnHelper, isAdmin, budgieId, updateStatusMutation]
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
            {table.getRowModel().rows.map((row) => (
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
