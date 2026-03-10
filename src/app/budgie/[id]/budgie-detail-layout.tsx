"use client";

import { useParams, usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { RedirectToSignIn } from "@clerk/nextjs";
import { api } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bird, PanelRight } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { MonthSelector } from "@/components/month-selector";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  BudgieDetailProvider,
  type BudgieDetailContextValue,
} from "./budgie-detail-context";

const TAB_ROUTES = [
  { segment: "expenses", label: "Expenses" },
  { segment: "payments", label: "Payments" },
  { segment: "destinations", label: "Destinations" },
  { segment: "collaborators", label: "Collaborators" },
] as const;

export function BudgieDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const { isSignedIn, isLoaded, userId } = useAuth();
  const id = params.id as string;

  const [selectedMonthId, setSelectedMonthId] = useState<string | null>(null);

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
  const { data: destinations = [] } = api.destination.list.useQuery(
    { budgieId: id },
    { enabled: !!id }
  );

  const contributorsWithSessionFirst = useMemo(() => {
    if (!userId || contributors.length === 0) return contributors;
    const sessionIndex = contributors.findIndex((c) => c.userId === userId);
    if (sessionIndex <= 0) return contributors;
    const sessionContributor = contributors[sessionIndex];
    const rest = contributors.filter((_, i) => i !== sessionIndex);
    return [sessionContributor!, ...rest];
  }, [contributors, userId]);

  if (isLoaded && !isSignedIn) {
    return <RedirectToSignIn />;
  }

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

  const basePath = `/budgie/${id}`;
  const isExpensesOrPayments =
    pathname === `${basePath}/expenses` || pathname === `${basePath}/payments`;

  const contextValue: BudgieDetailContextValue = {
    budgieId: id,
    budgie: { name: budgie.name },
    isAdmin,
    contributors,
    contributorsWithSessionFirst,
    destinations: destinations.map((d) => ({ id: d.id, name: d.name ?? null })),
    selectedMonthId,
    setSelectedMonthId,
    userId: userId ?? null,
  };

  return (
    <BudgieDetailProvider value={contextValue}>
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
            <div className="z-40 ml-auto md:hidden">
              <SidebarTrigger>
                <PanelRight className="h-4 w-4" />
                <span className="sr-only">Toggle Sidebar</span>
              </SidebarTrigger>
            </div>
          </div>

          <Separator />

          {/* Tab bar: desktop only */}
          <nav className="hidden md:flex gap-1 border-b" aria-label="Budgie sections">
            {TAB_ROUTES.map(({ segment, label }) => {
              const href = `${basePath}/${segment}`;
              const isActive = pathname === href;
              return (
                <Link
                  key={segment}
                  href={href}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-t-md transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary border-b-2 border-primary -mb-px"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {isExpensesOrPayments && (
            <>
              <MonthSelector
                budgieId={id}
                selectedMonthId={selectedMonthId}
                onSelectMonth={setSelectedMonthId}
                isAdmin={isAdmin}
              />
              <Separator />
            </>
          )}

          {children}
        </div>
      </main>
    </BudgieDetailProvider>
  );
}
