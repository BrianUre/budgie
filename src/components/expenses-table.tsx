"use client";

import { useMemo, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { api } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOptimisticCostListUpdate } from "@/hooks/use-optimistic-cost-list-update";
import { cn, formatMoney } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  buildExpensesTableColumns,
  type CostRow,
  type ExpensesTableContributor,
} from "@/components/expenses-table-columns";
import type { CostListForMonth } from "@/server/api/routers/cost";

export type ExpensesTableMeta = {
  costMutation: ReturnType<typeof api.cost.updateAmount.useMutation>;
  isAdmin: boolean;
  budgieId: string;
  selectedMonthId: string;
  currentUserId: string | null;
  contributors: ExpensesTableContributor[];
  contributor?: ExpensesTableContributor;
  isCurrentUser?: boolean;
  cellClassName?: string;
};

function ExpensesTableFooter({
  headers,
  totalCost,
  contributorTotals,
  contributors,
  currentUserId,
}: {
  headers: { id: string }[];
  totalCost: number;
  contributorTotals: Record<string, number>;
  contributors: ExpensesTableContributor[];
  currentUserId: string | null;
}) {
  return (
    <TableRow>
      {headers.map((header) => {
        const colId = header.id;
        const isCurrentUserCol =
          !!currentUserId &&
          !!contributors.find(
            (c) => c.id === colId && c.userId === currentUserId
          );
        if (colId === "expense") {
          return (
            <TableCell
              key={header.id}
              className="text-right font-medium text-xl font-zain"
            >
              Total
            </TableCell>
          );
        }
        if (colId === "cost") {
          return (
            <TableCell
              key={header.id}
              className="font-mono text-3xl text-right text-tertiary font-bold"
            >
              {formatMoney(totalCost)}
            </TableCell>
          );
        }
        return (
          <TableCell
            key={header.id}
            className={cn(
              "text-right text-3xl font-zain",
              isCurrentUserCol && "bg-primary/5 text-primary font-bold "
            )}
          >
            {formatMoney(contributorTotals[colId] ?? 0)}
          </TableCell>
        );
      })}
    </TableRow>
  );
}

export function ExpensesTable({
  costs,
  contributors,
  isAdmin,
  budgieId,
  selectedMonthId,
  currentUserId,
}: {
  costs: CostListForMonth;
  contributors: ExpensesTableContributor[];
  isAdmin: boolean;
  budgieId: string;
  selectedMonthId: string;
  currentUserId?: string | null;
}) {
  const isMobile = useIsMobile();
  const [extraColumnIndex, setExtraColumnIndex] = useState(0);

  const optimistic = useOptimisticCostListUpdate({
    monthId: selectedMonthId,
    budgieId,
  });
  const costMutation = api.cost.updateAmount.useMutation({
    onMutate: (input) =>
      optimistic.apply((rows) =>
        rows.map((row) =>
          row.id === input.costId ? { ...row, amount: input.amount } : row
        )
      ),
    onError: (_err, _vars, ctx) => optimistic.rollback(ctx?.snapshot),
  });

  const columnHelper = createColumnHelper<CostRow>();
  const allColumns = useMemo(
    () =>
      buildExpensesTableColumns({
        columnHelper,
        costMutation,
        isAdmin,
        budgieId,
        selectedMonthId,
        currentUserId: currentUserId ?? null,
        contributors,
      }),
    [
      contributors,
      isAdmin,
      budgieId,
      selectedMonthId,
      currentUserId,
      costMutation,
    ]
  );

  const extraColumnOptionsCount = 1 + contributors.length;
  const columns = useMemo(() => {
    if (!isMobile) return allColumns;
    const extraIndex = Math.min(
      Math.max(0, extraColumnIndex),
      extraColumnOptionsCount - 1
    );
    return [allColumns[0]!, allColumns[1 + extraIndex]!];
  }, [isMobile, extraColumnIndex, allColumns, extraColumnOptionsCount]);

  const table = useReactTable({
    data: costs,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const { totalCost, contributorTotals } = useMemo(() => {
    const total = costs.reduce((sum, c) => sum + c.amount, 0);
    const byContributor: Record<string, number> = {};
    for (const contributor of contributors) {
      let sum = 0;
      for (const cost of costs) {
        const contribution = cost.contributions.find(
          (c) => c.contributorId === contributor.id
        );
        sum += contribution ? contribution.amount : 0;
      }
      byContributor[contributor.id] = sum;
    }
    return { totalCost: total, contributorTotals: byContributor };
  }, [costs, contributors]);

  const cyclePrev = () => {
    setExtraColumnIndex((i) => (i <= 0 ? extraColumnOptionsCount - 1 : i - 1));
  };
  const cycleNext = () => {
    setExtraColumnIndex((i) => (i >= extraColumnOptionsCount - 1 ? 0 : i + 1));
  };

  const firstHeaderGroup = table.getHeaderGroups()[0];
  const extraColumnLabel =
    extraColumnIndex === 0
      ? "Cost"
      : (contributors[extraColumnIndex - 1]?.user?.name ??
        contributors[extraColumnIndex - 1]?.name ??
        "—");

  return (
    <div className="flex flex-col gap-2">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const isExpenseOrCost =
                  header.column.id === "expense" ||
                  header.column.id === "cost";
                return (
                  <TableHead
                    key={header.id}
                    className={cn(
                      "text-right",
                      isExpenseOrCost ? "px-4 py-3" : "p-0"
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
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={table.getAllColumns().length}
                className="text-muted-foreground text-center"
              >
                No expenses yet. Add one to get started.
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  const meta = cell.column.columnDef.meta as
                    | ExpensesTableMeta
                    | undefined;
                  return (
                    <TableCell
                      key={cell.id}
                      className={cn(meta?.cellClassName, "text-right")}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          )}
        </TableBody>
        {table.getRowModel().rows.length > 0 && firstHeaderGroup && (
          <TableFooter>
            <ExpensesTableFooter
              headers={firstHeaderGroup.headers}
              totalCost={totalCost}
              contributorTotals={contributorTotals}
              contributors={contributors}
              currentUserId={currentUserId ?? null}
            />
          </TableFooter>
        )}
      </Table>
      {isMobile && extraColumnOptionsCount > 1 && (
        <div className="flex items-center justify-center gap-2 py-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={cyclePrev}
            aria-label="Previous column"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[6rem] text-center text-sm text-muted-foreground">
            {extraColumnLabel}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={cycleNext}
            aria-label="Next column"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
