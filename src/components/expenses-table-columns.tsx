"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { createColumnHelper } from "@tanstack/react-table";
import type { CostListForMonth } from "@/server/api/routers/cost";
import { formatMoney } from "@/lib/utils";
import { CostAmountEdit } from "@/components/cost-amount-edit";
import { CostContributionCell } from "@/components/cost-contribution-cell";
import { ContributorColumnHeader } from "@/components/contributor-column-header";

export type CostRow = CostListForMonth[number];

export type ExpensesTableContributor = {
  id: string;
  name: string | null;
  userId?: string | null;
  user?: {
    name?: string | null;
    email?: string | null;
    imageUrl?: string | null;
  } | null;
};

export type ExpensesTableColumnsDeps = {
  columnHelper: ReturnType<typeof createColumnHelper<CostRow>>;
  costMutation: {
    mutateAsync: (input: {
      budgieId: string;
      costId: string;
      amount: number;
    }) => Promise<unknown>;
    isPending: boolean;
  };
  isAdmin: boolean;
  budgieId: string;
  selectedMonthId: string;
  currentUserId: string | null;
  contributors: ExpensesTableContributor[];
};

export function buildExpensesTableColumns(
  deps: ExpensesTableColumnsDeps
): ColumnDef<CostRow, unknown>[] {
  const {
    columnHelper,
    costMutation,
    isAdmin,
    budgieId,
    selectedMonthId,
    currentUserId,
    contributors,
  } = deps;

  const expenseCol = columnHelper.accessor(
    (row) => row.expense?.name ?? "—",
    {
      id: "expense",
      header: "Expense",
      cell: ({ getValue }) => (
        <span className="font-medium sm:text-2xl font-zain">{getValue()}</span>
      ),
    }
  );

  const sharedMeta = {
    costMutation,
    isAdmin,
    budgieId,
    selectedMonthId,
    currentUserId,
    contributors,
  };

  const costCol = columnHelper.accessor((row) => row.amount, {
    id: "cost",
    header: "Cost",
    meta: { ...sharedMeta, cellClassName: "font-mono text-2xl" },
    cell: ({ row, column }) => {
      const meta = column.columnDef.meta as typeof sharedMeta & {
        cellClassName?: string;
      };
      if (!meta) return null;
      const amount = row.original.amount;
      const contributionSum = row.original.contributions.reduce(
        (sum, c) => sum + c.amount,
        0
      );
      const diff = amount - contributionSum;
      const showDiff = Math.abs(diff) >= 0.005;
      return (
        <div className="relative">
          {meta.isAdmin ? (
            <CostAmountEdit
              value={amount}
              onSave={(v) =>
                meta.costMutation.mutateAsync({
                  budgieId: meta.budgieId,
                  costId: row.original.id,
                  amount: v,
                })
              }
              isPending={meta.costMutation.isPending}
            />
          ) : (
            <div className="text-right text-2xl font-zain">{formatMoney(amount)}</div>
          )}
          {showDiff && (
            <span
              className={`absolute -bottom-4 right-0 text-xs font-mono ${diff > 0 ? "text-red-500" : "text-green-500"}`}
            >
              {diff > 0 ? `-${formatMoney(diff)}` : `+${formatMoney(Math.abs(diff))}`}
            </span>
          )}
        </div>
      );
    },
  });

  const contributorCols: ColumnDef<CostRow, unknown>[] = contributors.map(
    (contributor) => {
      const isCurrentUser =
        !!currentUserId && contributor.userId === currentUserId;
      return columnHelper.display({
        id: contributor.id,
        header: () => (
          <ContributorColumnHeader
            contributor={contributor}
            isCurrentUser={isCurrentUser}
          />
        ),
        meta: {
          ...sharedMeta,
          contributor,
          isCurrentUser,
          cellClassName: isCurrentUser ? "bg-primary/5" : undefined,
        },
        cell: ({ row, column }) => {
          const meta = column.columnDef.meta as typeof sharedMeta & {
            contributor: ExpensesTableContributor;
            isCurrentUser?: boolean;
            cellClassName?: string;
          };
          if (!meta?.contributor) return null;
          const contribution = row.original.contributions.find(
            (c) => c.contributorId === meta.contributor.id
          );
          return (
            <CostContributionCell
              costId={row.original.id}
              contribution={contribution}
              isAdmin={meta.isAdmin}
              monthId={meta.selectedMonthId}
              budgieId={meta.budgieId}
              isCurrentUser={meta.isCurrentUser}
            />
          );
        },
      });
    }
  );

  return [expenseCol, costCol, ...contributorCols] as ColumnDef<
    CostRow,
    unknown
  >[];
}
