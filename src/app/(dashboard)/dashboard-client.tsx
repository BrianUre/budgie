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
import { Plus } from "lucide-react";

export function DashboardClient() {
  const { isSignedIn, isLoaded } = useAuth();
  const {
    data: budgies,
    isLoading,
    error,
  } = api.budgie.list.useQuery(undefined, {
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
                name={budgie.name}
                id={budgie.id}
                updatedAt={budgie.updatedAt}
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
  updatedAt,
}: {
  name: string;
  id: string;
  updatedAt: Date | string;
}) {
  return (
    <Card>
      <Link key={id} href={`/budgie/${id}`}>
        <CardHeader>
          <CardTitle>{name}</CardTitle>
          <CardDescription>
            Updated {new Date(updatedAt).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
      </Link>
    </Card>
  );
}
