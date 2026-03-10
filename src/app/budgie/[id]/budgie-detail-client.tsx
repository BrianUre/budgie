"use client";

import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { RedirectToSignIn } from "@clerk/nextjs";
import { api } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bird, PanelRight } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { MonthSelector } from "@/components/month-selector";
import { ExpensesView } from "@/components/expenses-view";
import { ContributorsList } from "@/components/contributors-list";
import { Separator } from "@/components/ui/separator";
import { DestinationsCard } from "@/components/destinations-card";
import { PaymentsPanel } from "@/components/payments-panel";

export function BudgieDetailClient() {
  const params = useParams();
  const { isSignedIn, isLoaded, userId } = useAuth();
  const id = params.id as string;

  if (isLoaded && !isSignedIn) {
    return <RedirectToSignIn />;
  }

  const {
    data: budgie,
    isLoading: budgieLoading,
    error: budgieError,
  } = api.budgie.getById.useQuery(
    { id },
    { enabled: !!id && isLoaded && !!isSignedIn }
  );
  const { data: contributors = [] } = api.contributor.list.useQuery(
    { budgieId: id },
    { enabled: !!id && !!budgie }
  );
  const { data: isAdmin = false } = api.contributor.isAdmin.useQuery(
    { budgieId: id },
    { enabled: !!id && !!budgie }
  );

  const [selectedMonthId, setSelectedMonthId] = useState<string | null>(null);

  const { data: costsForMonth = [] } = api.cost.listForMonth.useQuery(
    { monthId: selectedMonthId!, budgieId: id },
    { enabled: !!selectedMonthId }
  );
  const { data: destinations = [] } = api.destination.list.useQuery(
    { budgieId: id },
    { enabled: !!id }
  );
  const activeCosts = useMemo(
    () => costsForMonth.filter((cost) => cost.isActive),
    [costsForMonth]
  );

  const contributorsWithSessionFirst = useMemo(() => {
    if (!userId || contributors.length === 0) return contributors;
    const sessionIndex = contributors.findIndex((c) => c.userId === userId);
    if (sessionIndex <= 0) return contributors;
    const sessionContributor = contributors[sessionIndex];
    const rest = contributors.filter((_, i) => i !== sessionIndex);
    return [sessionContributor!, ...rest];
  }, [contributors, userId]);

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
    <main className="flex min-h-screen flex-col sm:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-4">
        <div className="flex items-center gap-2 py-2">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <Bird className="h-6 w-6 text-tertiary" />
          <h1 className="text-base sm:text-2xl text-tertiary font-atma">
            <span className="font-semibold text-primary font-atma">
              Budgie:
            </span>{" "}
            {budgie.name}
          </h1>
          <div className="z-40 ml-auto sm:hidden">
            <SidebarTrigger>
              <PanelRight className="h-4 w-4" />
              <span className="sr-only">Toggle Sidebar</span>
            </SidebarTrigger>
          </div>
        </div>

        <Separator className="" />

        <MonthSelector
          budgieId={id}
          selectedMonthId={selectedMonthId}
          onSelectMonth={setSelectedMonthId}
          isAdmin={isAdmin}
        />

        <Separator />

        <ExpensesView
          budgieId={id}
          selectedMonthId={selectedMonthId}
          isAdmin={isAdmin}
          contributors={contributorsWithSessionFirst}
          currentUserId={userId}
          costsForMonth={costsForMonth}
        />

        <Separator />

        {contributorsWithSessionFirst.length > 0 && (
          <PaymentsPanel
            contributors={contributorsWithSessionFirst}
            costs={activeCosts}
            destinations={destinations}
            currentUserId={userId}
          />
        )}
        {/*

        <DestinationsCard
          budgieId={id}
          isAdmin={isAdmin}
          destinations={destinations}
        />

        <ContributorsList
          budgieId={id}
          contributors={contributorsWithSessionFirst}
          isAdmin={isAdmin}
        /> */}
      </div>
    </main>
  );
}
