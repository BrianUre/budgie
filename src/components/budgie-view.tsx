"use client";

import { useMemo, useState } from "react";
import {
  type ColumnDef,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { api } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ManageExpensesDialog } from "@/components/manage-expenses-dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn, formatMoney } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { Costs } from "@/server/services/cost.service";

type Contributor = {
  id: string;
  name: string | null;
  userId?: string | null;
  user?: { name?: string | null; email?: string | null } | null;
};

type Contribution = {
  id: string;
  costId: string;
  contributorId: string;
  percentage: unknown;
};

function CostEdit({
  value,
  onSave,
  isPending,
}: {
  value: number;
  onSave: (v: number) => Promise<unknown>;
  isPending: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  const handleSave = async () => {
    const v = parseFloat(draft);
    if (!Number.isNaN(v) && v >= 0) {
      await onSave(v);
      setEditing(false);
    }
  };

  if (editing) {
    return (
      <span className="flex items-center gap-1">
        <Input
          type="number"
          min={0}
          step={0.01}
          className="h-8 w-24"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => void handleSave()}
          onKeyDown={(e) => e.key === "Enter" && void handleSave()}
        />
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={() => void handleSave()}
          disabled={isPending}
        >
          <Pencil className="h-3 w-3" />
        </Button>
      </span>
    );
  }
  return (
    <button
      type="button"
      className="flex items-center gap-1 hover:underline text-base sm:text-2xl"
      onClick={() => {
        setDraft(String(value));
        setEditing(true);
      }}
    >
      {formatMoney(value)}
      <Pencil className="h-3 w-3 opacity-70" />
    </button>
  );
}

function ContributionCell({
  costId,
  costAmount,
  contribution,
  isAdmin,
  monthId,
  budgieId,
  isCurrentUser,
}: {
  costId: string;
  costAmount: number;
  contribution: Contribution | undefined;
  isAdmin: boolean;
  monthId: string;
  budgieId: string;
  isCurrentUser?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const utils = api.useUtils();
  const setPercentageMutation = api.contribution.setPercentage.useMutation({
    onSuccess: () => {
      void utils.contribution.listForMonth.invalidate({ monthId });
      void utils.cost.listForMonth.invalidate({ monthId, budgieId });
    },
  });

  const percentage = contribution ? Number(contribution.percentage) : 0;
  const amount = costAmount * (percentage / 100);

  const handleSave = async () => {
    const value = parseFloat(draft);
    if (
      !Number.isNaN(value) &&
      value >= 0 &&
      value <= 100 &&
      contribution
    ) {
      await setPercentageMutation.mutateAsync({
        costId,
        contributionId: contribution.id,
        percentage: value,
      });
      setEditing(false);
    }
  };

  return (
    <div>
    <div className="flex items-center justify-end gap-2">
      <span
        className={cn(
          "font-mono !text-base sm:!text-2xl",
          isCurrentUser && "text-primary font-semibold"
        )}
      >
        {formatMoney(amount)}
      </span>
      {isAdmin && editing ? (
        <span className="flex items-center gap-1">
          <Input
            type="number"
            min={0}
            max={100}
            step={0.5}
            className="h-8 w-16"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => void handleSave()}
            onKeyDown={(e) => e.key === "Enter" && void handleSave()}
          />
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => void handleSave()}
            disabled={setPercentageMutation.isPending}
          >
            <Pencil className="h-3 w-3" />
          </Button>
        </span>
      ) : (
        <span
          className={cn(
            "!text:sm sm:text-sm",
            isAdmin
              ? "cursor-pointer hover:underline"
              : "text-muted-foreground",
            isCurrentUser && "text-primary font-semibold"
          )}
          onClick={
            isAdmin
              ? () => {
                  setDraft(String(percentage));
                  setEditing(true);
                }
              : undefined
          }
          onKeyDown={
            isAdmin
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setDraft(String(percentage));
                    setEditing(true);
                  }
                }
              : undefined
          }
            role={isAdmin ? "button" : undefined}
          tabIndex={isAdmin ? 0 : undefined}
        >
          {percentage}%
        </span>
      )}
    </div>
    </div>
  );
}

type CostRow = {
  id: string;
  amount: unknown;
  expense: { name: string } | null;
  contributions: Contribution[];
};

type ExpensesTableMeta = {
  costMutation: ReturnType<typeof api.cost.updateAmount.useMutation>;
  isAdmin: boolean;
  budgieId: string;
  selectedMonthId: string;
  currentUserId: string | null;
  contributors: Contributor[];
  contributor?: Contributor;
  isCurrentUser?: boolean;
  cellClassName?: string;
};

function ExpensesTable({
  costs,
  contributors,
  isAdmin,
  budgieId,
  selectedMonthId,
  currentUserId,
}: {
  costs: CostRow[];
  contributors: Contributor[];
  isAdmin: boolean;
  budgieId: string;
  selectedMonthId: string;
  currentUserId?: string | null;
}) {
  const isMobile = useIsMobile();
  const [extraColumnIndex, setExtraColumnIndex] = useState(0);

  const utils = api.useUtils();
  const costMutation = api.cost.updateAmount.useMutation({
    onSuccess: () => {
      void utils.cost.listForMonth.invalidate({
        monthId: selectedMonthId,
        budgieId,
      });
    },
  });

  const columnHelper = createColumnHelper<CostRow>();
  const sharedMeta: Omit<ExpensesTableMeta, "contributor" | "isCurrentUser" | "cellClassName"> = {
    costMutation,
    isAdmin,
    budgieId,
    selectedMonthId,
    currentUserId: currentUserId ?? null,
    contributors,
  };

  const allColumns = useMemo<ColumnDef<CostRow, unknown>[]>(() => {
    const expenseCol = columnHelper.accessor(
      (row) => row.expense?.name ?? "—",
      {
        id: "expense",
        header: "Expense",
        cell: ({ getValue }) => (
          <span className="font-medium sm:text-2xl">{getValue()}</span>
        ),
      }
    );

    const costCol = columnHelper.accessor((row) => row.amount, {
      id: "cost",
      header: "Cost",
      meta: { ...sharedMeta, cellClassName: "font-mono text-2xl" },
      cell: ({ row, column }) => {
        const meta = column.columnDef.meta as ExpensesTableMeta | undefined;
        if (!meta) return null;
        const amount = Number(row.original.amount);
        return meta.isAdmin ? (
          <CostEdit
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
          formatMoney(amount)
        );
      },
    });

    const contributorCols: ColumnDef<CostRow, unknown>[] = contributors.map(
      (contributor) => {
        const isCurrentUser =
          !!currentUserId && contributor.userId === currentUserId;
        return columnHelper.display({
          id: contributor.id,
          header: contributor.user?.name ?? contributor.name ?? "—",
          meta: {
            ...sharedMeta,
            contributor,
            isCurrentUser,
            cellClassName: isCurrentUser ? "bg-primary/5" : undefined,
          },
          cell: ({ row, column }) => {
            const meta = column.columnDef.meta as ExpensesTableMeta | undefined;
            if (!meta?.contributor) return null;
            const contribution = row.original.contributions.find(
              (c: Contribution) => c.contributorId === meta.contributor!.id
            );
            return (
              <ContributionCell
                costId={row.original.id}
                costAmount={Number(row.original.amount)}
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
  }, [
    contributors,
    isAdmin,
    budgieId,
    selectedMonthId,
    currentUserId,
    costMutation,
  ]);

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

  const cyclePrev = () => {
    setExtraColumnIndex((i) =>
      i <= 0 ? extraColumnOptionsCount - 1 : i - 1
    );
  };
  const cycleNext = () => {
    setExtraColumnIndex((i) =>
      i >= extraColumnOptionsCount - 1 ? 0 : i + 1
    );
  };

  const extraColumnLabel =
    extraColumnIndex === 0
      ? "Cost"
      : contributors[extraColumnIndex - 1]?.user?.name ??
        contributors[extraColumnIndex - 1]?.name ??
        "—";

  return (
    <div className="flex flex-col gap-2">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </TableHead>
              ))}
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
                      className={meta?.cellClassName}
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

export function BudgieView({
  budgieId,
  selectedMonthId,
  isAdmin,
  contributors,
  currentUserId,
  className,
  costsForMonth,
}: {
  budgieId: string;
  selectedMonthId: string | null;
  isAdmin: boolean;
  contributors: Contributor[];
  currentUserId?: string | null;
  className?: string;
  costsForMonth: Costs;
}) {
  const activeCosts = useMemo(
    () => costsForMonth.filter((cost) => cost.isActive),
    [costsForMonth]
  );

  if (!selectedMonthId) {
    return (
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle>Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Select a month to see expenses and contributions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between px-4 py-0">
          <div>
            <CardTitle className="text-base sm:text-2xl">Expenses</CardTitle>
          </div>
          
          {isAdmin && (
            <ManageExpensesDialog
              budgieId={budgieId}
              selectedMonthId={selectedMonthId}
            />
          )}
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <ExpensesTable
            costs={activeCosts}
            contributors={contributors}
            isAdmin={isAdmin}
            budgieId={budgieId}
            selectedMonthId={selectedMonthId}
            currentUserId={currentUserId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
