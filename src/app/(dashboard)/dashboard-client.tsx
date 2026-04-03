"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { RedirectToSignIn } from "@clerk/nextjs";
import { api } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateBudgieDialog } from "@/components/create-budgie-dialog";
import { CreateCurrentMonthDialog } from "@/components/create-current-month-dialog";
import { formatMoney } from "@/lib/utils";
import { Plus, User } from "lucide-react";

export function DashboardClient() {
  const { isSignedIn, isLoaded } = useAuth();
  const {
    data: budgies,
    isLoading,
    error,
  } = api.budgie.listForDashboard.useQuery(undefined, {
    enabled: isLoaded && !!isSignedIn,
  });

  if (isLoaded && !isSignedIn) {
    return <RedirectToSignIn />;
  }

  if (!isLoaded || isLoading) {
    return (
      <main className="flex min-h-screen flex-col p-8">
        <p className="text-muted-foreground">Loading budgies…</p>
      </main>
    );
  }

  if (error) {
    const isUnauthorized =
      error.data?.code === "UNAUTHORIZED" ||
      error.message.includes("UNAUTHORIZED");
    if (isUnauthorized) return <RedirectToSignIn />;
    return (
      <main className="flex min-h-screen flex-col p-8">
        <p className="text-destructive">Failed to load: {error.message}</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col p-8 bg-gray-50">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold">Budgies</h1>
            <p className="subtitle">Manage your budgies</p>
          </div>
          <CreateBudgieDialog
            trigger={
              <Button>
                <Plus className="h-4 w-4" />
                New budgie
              </Button>
            }
          />
        </div>

        {!budgies?.length ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-4 sm:grid-cols-2">
            {budgies.map((budgie) => (
              <BudgieCard
                key={budgie.id}
                name={budgie.name}
                id={budgie.id}
                contributorCount={budgie.contributorCount}
                hasCurrentMonth={budgie.hasCurrentMonth}
                isAdmin={budgie.isAdmin}
                currentMonthExpenseTotal={budgie.currentMonthExpenseTotal}
                currentMonthPaidPercent={budgie.currentMonthPaidPercent}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function EmptyState() {
  return (
    <Card className="flex flex-col items-center justify-center h-60">
      <CardHeader className="flex flex-col items-center justify-center">
        <CardTitle>No budgies yet</CardTitle>
        <CardDescription>
          Create a budgie to start tracking expenses month to month with others.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CreateBudgieDialog
          trigger={
            <Button>
              <Plus className="h-4 w-4" />
              Create your first budgie
            </Button>
          }
          description="Give your budget sheet a name."
        />
      </CardContent>
    </Card>
  );
}

function BudgieCard({
  name,
  id,
  contributorCount,
  hasCurrentMonth,
  isAdmin,
  currentMonthExpenseTotal,
  currentMonthPaidPercent,
}: {
  name: string;
  id: string;
  contributorCount: number;
  hasCurrentMonth: boolean;
  isAdmin: boolean;
  currentMonthExpenseTotal: number;
  currentMonthPaidPercent: number;
}) {
  return (
    <Card className="relative">
      <CardHeader className="relative flex flex-row flex-wrap items-center justify-between gap-x-4 gap-y-2 space-y-0">
        <Link
          href={`/budgie/${id}`}
          className="absolute inset-0 z-0 rounded-lg"
          aria-label={`Open ${name}`}
        />
        <div className="relative z-10 flex w-full flex-row flex-wrap items-center justify-between gap-x-4 gap-y-2 pointer-events-none">
          <CardTitle className="min-w-0 shrink truncate">{name}</CardTitle>
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <User className="h-4 w-4 shrink-0" aria-hidden />
            <span>{contributorCount}</span>
          </span>
          {hasCurrentMonth ? (
            <>
              <span className="tabular-nums">
                {formatMoney(currentMonthExpenseTotal)}
              </span>
              <span className="tabular-nums">{currentMonthPaidPercent}%</span>
            </>
          ) : isAdmin ? (
            <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-3 sm:flex-initial">
              <p className="text-sm text-muted-foreground">No active month</p>
              <div className="pointer-events-auto">
                <CreateCurrentMonthDialog budgieId={id} />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No active month. Only an admin can start this month.
            </p>
          )}
        </div>
      </CardHeader>
    </Card>
  );
}
