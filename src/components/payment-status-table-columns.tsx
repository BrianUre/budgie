"use client";

import type { ColumnDef, Row, SortingFn } from "@tanstack/react-table";
import type { createColumnHelper } from "@tanstack/react-table";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import type { CostListForMonthItem } from "@/server/api/routers/cost";
import { formatMoney, cn } from "@/lib/utils";
import { PaymentStatusSelector } from "@/components/payment-status-selector";
import {
  DEFAULT_PAYMENT_STATUS,
  type PaymentStatusType,
} from "@/types/payment-status";
import type { api } from "@/lib/trpc/client";

export type PaymentStatusRow = CostListForMonthItem;

export type PaymentStatusColumnsDependencies = {
  columnHelper: ReturnType<typeof createColumnHelper<PaymentStatusRow>>;
  isAdmin: boolean;
  budgieId: string;
  updateStatusMutation: ReturnType<
    typeof api.cost.updatePaymentStatus.useMutation
  >;
};

const STATUS_WORKFLOW_ORDER: Record<PaymentStatusType, number> = {
  pending: 0,
  sent: 1,
  paid: 2,
  resolved: 3,
};

const emptyLastStringSort: SortingFn<PaymentStatusRow> = (
  a: Row<PaymentStatusRow>,
  b: Row<PaymentStatusRow>,
  columnId: string
) => {
  const valueA = (a.getValue(columnId) as string) ?? "";
  const valueB = (b.getValue(columnId) as string) ?? "";
  if (!valueA && !valueB) return 0;
  if (!valueA) return 1;
  if (!valueB) return -1;
  return valueA.localeCompare(valueB);
};

const statusWorkflowSort: SortingFn<PaymentStatusRow> = (
  a: Row<PaymentStatusRow>,
  b: Row<PaymentStatusRow>,
  columnId: string
) => {
  const statusA = a.getValue(columnId) as PaymentStatusType;
  const statusB = b.getValue(columnId) as PaymentStatusType;
  return STATUS_WORKFLOW_ORDER[statusA] - STATUS_WORKFLOW_ORDER[statusB];
};

function SortableHeader({
  label,
  isSorted,
  onClick,
  align = "left",
}: {
  label: string;
  isSorted: false | "asc" | "desc";
  onClick: () => void;
  align?: "left" | "right";
}) {
  const Icon =
    isSorted === "asc"
      ? ChevronUp
      : isSorted === "desc"
        ? ChevronDown
        : ChevronsUpDown;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 text-sm font-medium hover:text-foreground transition-colors",
        align === "right" && "ml-auto",
        isSorted ? "text-foreground" : "text-muted-foreground"
      )}
    >
      <span>{label}</span>
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

export function buildPaymentStatusColumns(
  dependencies: PaymentStatusColumnsDependencies
): ColumnDef<PaymentStatusRow, unknown>[] {
  const { columnHelper, isAdmin, budgieId, updateStatusMutation } =
    dependencies;

  const nameColumn = columnHelper.accessor((row) => row.expense?.name ?? "", {
    id: "name",
    header: ({ column }) => (
      <SortableHeader
        label="Name"
        isSorted={column.getIsSorted()}
        onClick={() => column.toggleSorting()}
      />
    ),
    cell: ({ row }) => (
      <span className="font-medium font-zain text-lg">
        {row.original.expense?.name ?? "—"}
      </span>
    ),
  });

  const destinationColumn = columnHelper.accessor(
    (row) => row.destination?.name ?? "",
    {
      id: "destination",
      sortingFn: emptyLastStringSort,
      header: ({ column }) => (
        <SortableHeader
          label="Destination"
          isSorted={column.getIsSorted()}
          onClick={() => column.toggleSorting()}
        />
      ),
      cell: ({ row }) => (
        <span className="font-zain text-lg">
          {row.original.destination?.name ?? "—"}
        </span>
      ),
    }
  );

  const amountColumn = columnHelper.accessor((row) => row.amount, {
    id: "amount",
    sortingFn: "basic",
    header: ({ column }) => (
      <SortableHeader
        label="Amount"
        isSorted={column.getIsSorted()}
        onClick={() => column.toggleSorting()}
        align="right"
      />
    ),
    cell: ({ row }) => (
      <span className="font-zain text-lg">{formatMoney(row.original.amount)}</span>
    ),
  });

  const statusColumn = columnHelper.accessor(
    (row) =>
      (row.paymentStatus?.status ?? DEFAULT_PAYMENT_STATUS) as PaymentStatusType,
    {
      id: "status",
      sortingFn: statusWorkflowSort,
      header: ({ column }) => (
        <SortableHeader
          label="Status"
          isSorted={column.getIsSorted()}
          onClick={() => column.toggleSorting()}
          align="right"
        />
      ),
      cell: ({ row }) => (
        <PaymentStatusSelector
          value={
            (row.original.paymentStatus?.status ??
              DEFAULT_PAYMENT_STATUS) as PaymentStatusType
          }
          disabled={!isAdmin}
          onChange={(nextStatus) => {
            if (!isAdmin) return;
            updateStatusMutation.mutate({
              costId: row.original.id,
              status: nextStatus,
              budgieId,
            });
          }}
        />
      ),
    }
  );

  return [
    nameColumn,
    destinationColumn,
    amountColumn,
    statusColumn,
  ] as ColumnDef<PaymentStatusRow, unknown>[];
}
