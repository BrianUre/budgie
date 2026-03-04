"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "@tanstack/react-form";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { RedirectToSignIn } from "@clerk/nextjs";
import { api } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, Plus } from "lucide-react";
import { ContributionGrid } from "@/components/contribution-grid";
import { ExpenseCostRow } from "@/components/expense-cost-row";

function formatMonth(date: Date) {
  const monthName = new Intl.DateTimeFormat(undefined, { month: "short" }).format(date);
  return `${monthName} ${date.getFullYear()}`;
}

export function BudgieDetailClient() {
  const params = useParams();
  const { isSignedIn, isLoaded } = useAuth();
  const id = params.id as string;

  if (isLoaded && !isSignedIn) {
    return <RedirectToSignIn />;
  }

  const utils = api.useUtils();
  const { data: budgie, isLoading: budgieLoading, error: budgieError } = api.budgie.getById.useQuery(
    { id },
    { enabled: !!id && isLoaded && !!isSignedIn }
  );
  const { data: months = [] } = api.month.list.useQuery(
    { budgieId: id },
    { enabled: !!id && !!budgie }
  );

  const [selectedMonthId, setSelectedMonthId] = useState<string | null>(null);
  useEffect(() => {
    if (months.length > 0 && selectedMonthId === null) {
      setSelectedMonthId(months[0]!.id);
    }
  }, [months, selectedMonthId]);

  const { data: expenses = [] } = api.expense.list.useQuery(
    { budgieId: id },
    { enabled: !!id && !!budgie }
  );
  const { data: costs = [] } = api.cost.listForMonth.useQuery(
    { monthId: selectedMonthId!, budgieId: id },
    { enabled: !!selectedMonthId }
  );
  const { data: contributors = [] } = api.contributor.list.useQuery(
    { budgieId: id },
    { enabled: !!id && !!budgie }
  );
  const { data: contributionsForMonth = [] } = api.contribution.listForMonth.useQuery(
    { monthId: selectedMonthId! },
    { enabled: !!selectedMonthId }
  );
  const { data: isAdmin = false } = api.contributor.isAdmin.useQuery(
    { budgieId: id },
    { enabled: !!id && !!budgie }
  );

  const costMutation = api.cost.updateAmount.useMutation({
    onSuccess: () => {
      void utils.cost.listForMonth.invalidate({ monthId: selectedMonthId! });
    },
  });
  const expenseMutation = api.expense.create.useMutation({
    onSuccess: () => {
      void utils.expense.list.invalidate({ budgieId: id });
      void utils.cost.listForMonth.invalidate({ monthId: selectedMonthId! });
    },
  });
  const contributorMutation = api.contributor.add.useMutation({
    onSuccess: () => {
      void utils.contributor.list.invalidate({ budgieId: id });
    },
  });
  const selectedMonth = useMemo(
    () => months.find((month) => month.id === selectedMonthId),
    [months, selectedMonthId]
  );

  const contributionsByCost = useMemo(() => {
    const map = new Map<string, typeof contributionsForMonth>();
    for (const contribution of contributionsForMonth) {
      const list = map.get(contribution.costId) ?? [];
      list.push(contribution);
      map.set(contribution.costId, list);
    }
    return map;
  }, [contributionsForMonth]);

  const costByExpense = useMemo(() => {
    const map = new Map<string, (typeof costs)[0]>();
      for (const cost of costs) {
      map.set(cost.expenseId, cost);
    }
    return map;
  }, [costs]);

  const totalCostAmount = useMemo(() => {
    return costs.reduce((sum, cost) => sum + Number(cost.amount), 0);
  }, [costs]);

  const totalByContributor = useMemo(() => {
    const map = new Map<string, number>();
    for (const contributor of contributors) {
      let total = 0;
      for (const cost of costs) {
        const costContributions = contributionsByCost.get(cost.id) ?? [];
        const contribution = costContributions.find(
          (costContribution) =>
            costContribution.contributorId === contributor.id
        );
        if (contribution) {
          total +=
            Number(cost.amount) * (Number(contribution.percentage) / 100);
        }
      }
      map.set(contributor.id, total);
    }
    return map;
  }, [contributors, costs, contributionsByCost]);

  const expenseForm = useForm({
    defaultValues: { name: "", initialAmount: 0 },
    onSubmit: async ({ value }) => {
      await expenseMutation.mutateAsync({
        budgieId: id,
        monthId: selectedMonthId!,
        name: value.name,
        initialAmount: value.initialAmount,
      });
    },
  });

  const contributorForm = useForm({
    defaultValues: { name: "", linkToUserId: "" },
    onSubmit: async ({ value }) => {
      await contributorMutation.mutateAsync({
        budgieId: id,
        name: value.name || undefined,
        userId: value.linkToUserId || undefined,
      });
    },
  });

  if (!isLoaded || budgieLoading || !id) {
    return (
      <main className="flex min-h-screen flex-col p-8">
        <p className="text-muted-foreground">Loading…</p>
      </main>
    );
  }
  if (budgieError || !budgie) {
    const isUnauthorized =
      budgieError?.data?.code === "UNAUTHORIZED" ||
      budgieError?.message?.includes("UNAUTHORIZED");
    if (isUnauthorized) return <RedirectToSignIn />;
    return (
      <main className="flex min-h-screen flex-col p-8">
        <p className="text-destructive">
          {budgieError?.message ?? "Budgie not found"}
        </p>
        <Link href="/">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col p-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{budgie.name}</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Month</CardTitle>
            <CardDescription>Select the month to view and edit.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {months.map((month) => (
              <Button
                key={month.id}
                variant={
                  selectedMonthId === month.id ? "default" : "outline"
                }
                size="sm"
                onClick={() => setSelectedMonthId(month.id)}
              >
                {formatMonth(new Date(month.date))}
              </Button>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Expenses</CardTitle>
                <CardDescription>Costs are per month; add an expense to track it.</CardDescription>
              </div>
              {isAdmin && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4" />
                      Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        expenseForm.handleSubmit();
                      }}
                    >
                      <DialogHeader>
                        <DialogTitle>Add expense</DialogTitle>
                        <DialogDescription>
                          Name and initial cost for the selected month.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <expenseForm.Field name="name">
                          {(field) => (
                            <div className="grid gap-2">
                              <Label>Name</Label>
                              <Input
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="e.g. Rent"
                              />
                            </div>
                          )}
                        </expenseForm.Field>
                        <expenseForm.Field name="initialAmount">
                          {(field) => (
                            <div className="grid gap-2">
                              <Label>Initial amount</Label>
                              <Input
                                type="number"
                                min={0}
                                step={0.01}
                                value={field.state.value || ""}
                                onChange={(e) =>
                                  field.handleChange(parseFloat(e.target.value) || 0)
                                }
                              />
                            </div>
                          )}
                        </expenseForm.Field>
                      </div>
                      <DialogFooter>
                        <Button
                          type="submit"
                          disabled={!selectedMonthId || expenseMutation.isPending}
                        >
                          {expenseMutation.isPending ? "Adding…" : "Add"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {expenses
                  .filter((expense) => costByExpense.has(expense.id))
                  .map((expense) => {
                    const cost = costByExpense.get(expense.id)!;
                    return (
                      <ExpenseCostRow
                        key={expense.id}
                        expense={expense}
                        cost={cost}
                        selectedMonthId={selectedMonthId}
                        isAdmin={isAdmin}
                        onSaveCost={(costId, amount) =>
                          costMutation.mutateAsync({ budgieId: id, costId, amount })
                        }
                        isCostPending={costMutation.isPending}
                      />
                    );
                  })}
                {expenses.length === 0 && (
                  <li className="text-muted-foreground text-sm">
                    No expenses yet. Add one to get started.
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Contributors</CardTitle>
                <CardDescription>
                  People and entities that share costs. Percentages are set per cost below.
                </CardDescription>
              </div>
              {isAdmin && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4" />
                      Add contributor
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        contributorForm.handleSubmit();
                      }}
                    >
                      <DialogHeader>
                        <DialogTitle>Add contributor</DialogTitle>
                        <DialogDescription>
                          Add a symbolic entity (e.g. landlord) or link to an existing user.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <contributorForm.Field name="name">
                          {(field) => (
                            <div className="grid gap-2">
                              <Label>Name</Label>
                              <Input
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="e.g. Landlord or leave empty when linking user"
                              />
                            </div>
                          )}
                        </contributorForm.Field>
                      </div>
                      <DialogFooter>
                        <Button
                          type="submit"
                          disabled={contributorMutation.isPending}
                        >
                          {contributorMutation.isPending ? "Adding…" : "Add"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                {contributors.map((contributor) => (
                  <li key={contributor.id}>
                    {contributor.user?.email ?? contributor.name}
                  </li>
                ))}
                {contributors.length === 0 && (
                  <li className="text-muted-foreground">No contributors yet.</li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>

        {contributors.length > 0 && !!selectedMonthId && (
          <Card className="">
            <CardHeader>
              <CardTitle>Contribution split</CardTitle>
              <CardDescription>
                Set each contributor&apos;s share per cost (percentages sum to 100%).
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <ContributionGrid budgieId={id} monthId={selectedMonthId} />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Totals</CardTitle>
            <CardDescription>
              Total costs and each contributor&apos;s share for the selected month.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-medium">
                Total costs: {formatMoney(totalCostAmount)}
              </p>
              {contributors.map((contributor) => (
                <p
                  key={contributor.id}
                  className="text-sm text-muted-foreground"
                >
                  {contributor.user?.email ?? contributor.name}:{" "}
                  {formatMoney(totalByContributor.get(contributor.id) ?? 0)}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(amount);
}
