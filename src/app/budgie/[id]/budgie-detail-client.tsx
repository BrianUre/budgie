"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { RedirectToSignIn } from "@clerk/nextjs";
import { api } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { MonthSelector } from "@/components/month-selector";
import { BudgieView } from "@/components/budgie-view";
import { ContributorsList } from "@/components/contributors-list";

export function BudgieDetailClient() {
  const params = useParams();
  const { isSignedIn, isLoaded } = useAuth();
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

        <MonthSelector
          budgieId={id}
          selectedMonthId={selectedMonthId}
          onSelectMonth={setSelectedMonthId}
        />

        <BudgieView
          budgieId={id}
          selectedMonthId={selectedMonthId}
          isAdmin={isAdmin}
          contributors={contributors}
        />

        <ContributorsList
          budgieId={id}
          contributors={contributors}
          isAdmin={isAdmin}
        />
      </div>
    </main>
  );
}
