"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatMonth(year: number, month: number) {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

export function BudgieDetailClient() {
  const params = useParams();
  const router = useRouter();
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

  const now = useMemo(() => ({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 }), []);
  const currentMonthRow = useMemo(
    () => months.find((m) => m.year === now.year && m.month === now.month),
    [months, now]
  );
  const [selectedMonthId, setSelectedMonthId] = useState<string | null>(null);
  const effectiveMonthId = selectedMonthId ?? currentMonthRow?.id ?? months[0]?.id ?? null;

  const { data: expenses = [] } = api.expense.list.useQuery(
    { budgieId: id },
    { enabled: !!id && !!budgie }
  );
  const { data: costs = [] } = api.cost.listForMonth.useQuery(
    { monthId: effectiveMonthId! },
    { enabled: !!effectiveMonthId }
  );
  const { data: admins = [] } = api.admin.listForBudgie.useQuery(
    { budgieId: id },
    { enabled: !!id && !!budgie }
  );
  const { data: contributorsList = [] } = api.contributor.list.useQuery(
    { budgieId: id },
    { enabled: !!id && !!budgie }
  );
  const { data: contributionsForMonth = [] } = api.contribution.listForMonth.useQuery(
    { monthId: effectiveMonthId! },
    { enabled: !!effectiveMonthId }
  );
  const { data: isAdmin = false } = api.admin.isAdmin.useQuery(
    { budgieId: id },
    { enabled: !!id && !!budgie }
  );

  const costMutation = api.cost.updateAmount.useMutation({
    onSuccess: () => {
      void utils.cost.listForMonth.invalidate({ monthId: effectiveMonthId! });
    },
  });
  const expenseMutation = api.expense.create.useMutation({
    onSuccess: () => {
      void utils.expense.list.invalidate({ budgieId: id });
      void utils.cost.listForMonth.invalidate({ monthId: effectiveMonthId! });
    },
  });
  const contributorMutation = api.contributor.create.useMutation({
    onSuccess: () => {
      void utils.contributor.list.invalidate({ budgieId: id });
    },
  });
  const contributionMutation = api.contribution.setPercentages.useMutation({
    onSuccess: () => {
      void utils.contribution.listForMonth.invalidate({ monthId: effectiveMonthId! });
    },
  });

  const selectedMonth = useMemo(
    () => months.find((m) => m.id === effectiveMonthId),
    [months, effectiveMonthId]
  );

  const contributionsByCost = useMemo(() => {
    const map = new Map<string, typeof contributionsForMonth>();
    for (const c of contributionsForMonth) {
      const list = map.get(c.costId) ?? [];
      list.push(c);
      map.set(c.costId, list);
    }
    return map;
  }, [contributionsForMonth]);

  const contributorRows = useMemo(() => {
    const list: { id: string; label: string; type: "user" | "contributor" }[] = [];
    for (const a of admins) {
      list.push({ id: a.user.id, label: a.user.email, type: "user" });
    }
    for (const c of contributorsList) {
      list.push({ id: c.id, label: c.name, type: "contributor" });
    }
    return list;
  }, [admins, contributorsList]);

  const costByExpense = useMemo(() => {
    const map = new Map<string, (typeof costs)[0]>();
    for (const c of costs) {
      map.set(c.expenseId, c);
    }
    return map;
  }, [costs]);

  const totalCostAmount = useMemo(() => {
    return costs.reduce((sum, c) => sum + Number(c.amount), 0);
  }, [costs]);

  const totalByContributor = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of contributorRows) {
      let total = 0;
      for (const cost of costs) {
        const contribs = contributionsByCost.get(cost.id) ?? [];
        const c = contribs.find(
          (x) => (row.type === "user" && x.userId === row.id) || (row.type === "contributor" && x.contributorId === row.id)
        );
        if (c) total += Number(cost.amount) * (Number(c.percentage) / 100);
      }
      map.set(row.id, total);
    }
    return map;
  }, [contributorRows, costs, contributionsByCost]);

  const expenseForm = useForm({
    defaultValues: { name: "", initialAmount: 0 },
    onSubmit: async ({ value }) => {
      await expenseMutation.mutateAsync({
        budgieId: id,
        name: value.name,
        initialAmount: value.initialAmount,
        year: selectedMonth?.year,
        month: selectedMonth?.month,
      });
    },
  });

  const contributorForm = useForm({
    defaultValues: { name: "" },
    onSubmit: async ({ value }) => {
      await contributorMutation.mutateAsync({ budgieId: id, name: value.name });
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
            {months.map((m) => (
              <Button
                key={m.id}
                variant={effectiveMonthId === m.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedMonthId(m.id)}
              >
                {formatMonth(m.year, m.month)}
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
                          disabled={expenseMutation.isPending}
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
                  .filter((e) => costByExpense.has(e.id))
                  .map((e) => {
                    const cost = costByExpense.get(e.id)!;
                    return (
                      <ExpenseCostRow
                        key={e.id}
                        expense={e}
                        cost={cost}
                        effectiveMonthId={effectiveMonthId}
                        isAdmin={isAdmin}
                        onSaveCost={(costId, amount) =>
                          costMutation.mutateAsync({ costId, amount })
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
                          Add an entity (e.g. landlord) that contributes income or shares costs.
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
                                placeholder="e.g. Landlord"
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
                {contributorRows.map((r) => (
                  <li key={r.id}>{r.label}</li>
                ))}
                {contributorRows.length === 0 && (
                  <li className="text-muted-foreground">No contributors yet.</li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>

        {costs.length > 0 && contributorRows.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Contribution split</CardTitle>
              <CardDescription>
                Percentages per cost must sum to 100%. Change one and others rebalance.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <ContributionGrid
                costs={costs}
                contributorRows={contributorRows}
                contributionsByCost={contributionsByCost}
                isAdmin={isAdmin}
                onSetPercentages={(costId, contributions) =>
                  contributionMutation.mutateAsync({ costId, contributions })
                }
                isPending={contributionMutation.isPending}
              />
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
              {contributorRows.map((r) => (
                <p key={r.id} className="text-sm text-muted-foreground">
                  {r.label}: {formatMoney(totalByContributor.get(r.id) ?? 0)}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function formatMoney(n: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(n);
}
