"use client";

import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
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
import { Plus } from "lucide-react";

export function DashboardClient() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const utils = api.useUtils();
  const { data: budgies, isLoading, error } = api.budgie.list.useQuery(
    undefined,
    { enabled: isLoaded && !!isSignedIn }
  );

  if (isLoaded && !isSignedIn) {
    return <RedirectToSignIn />;
  }

  const createBudgie = api.budgie.create.useMutation({
    onSuccess: (budgie) => {
      void utils.budgie.list.invalidate();
      router.push(`/budgie/${budgie.id}`);
    },
  });

  const form = useForm({
    defaultValues: { name: "" },
    onSubmit: async ({ value }) => {
      await createBudgie.mutateAsync({ name: value.name });
    },
  });

  if (!isLoaded || isLoading) {
    return (
      <main className="flex min-h-screen flex-col p-8">
        <p className="text-muted-foreground">Loading budgies…</p>
      </main>
    );
  }

  if (error) {
    const isUnauthorized = error.data?.code === "UNAUTHORIZED" || error.message.includes("UNAUTHORIZED");
    if (isUnauthorized) return <RedirectToSignIn />;
    return (
      <main className="flex min-h-screen flex-col p-8">
        <p className="text-destructive">Failed to load: {error.message}</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col p-8">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Budgies</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" />
                New budgie
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit();
                }}
              >
                <DialogHeader>
                  <DialogTitle>Create a budgie</DialogTitle>
                  <DialogDescription>
                    Give your budget sheet a name. You can change it later.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <form.Field name="name">
                    {(field) => (
                      <div className="grid gap-2">
                        <Label htmlFor="budgie-name">Name</Label>
                        <Input
                          id="budgie-name"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="e.g. Household budget"
                        />
                        {field.state.meta.errors.length > 0 && (
                          <p className="text-sm text-destructive">
                            {field.state.meta.errors.join(", ")}
                          </p>
                        )}
                      </div>
                    )}
                  </form.Field>
                </div>
                <DialogFooter>
                  {!form.state.values.name.trim() ? "Creating…" : "Create"}
                  <Button
                    type="submit"
                    disabled={createBudgie.isPending || !form.state.values.name.trim()}
                  >
                    {createBudgie.isPending ? "Creating…" : "Create"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {!budgies?.length ? (
          <Card>
            <CardHeader>
              <CardTitle>No budgies yet</CardTitle>
              <CardDescription>
                Create a budgie to start tracking expenses month to month with
                others.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4" />
                    Create your first budgie
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      form.handleSubmit();
                    }}
                  >
                    <DialogHeader>
                      <DialogTitle>Create a budgie</DialogTitle>
                      <DialogDescription>
                        Give your budget sheet a name.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <form.Field name="name">
                        {(field) => (
                          <div className="grid gap-2">
                            <Label htmlFor="budgie-name-2">Name</Label>
                            <Input
                              id="budgie-name-2"
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              placeholder="e.g. Household budget"
                            />
                          </div>
                        )}
                      </form.Field>
                    </div>
                    <DialogFooter>
                      <Button
                        type="submit"
                        disabled={
                          createBudgie.isPending ||
                          !form.state.values.name.trim()
                        }
                      >
                        {createBudgie.isPending ? "Creating…" : "Create"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {budgies.map((budgie) => (
              <Link key={budgie.id} href={`/budgie/${budgie.id}`}>
                <Card className="transition-colors hover:bg-accent/50">
                  <CardHeader>
                    <CardTitle>{budgie.name}</CardTitle>
                    <CardDescription>
                      Updated{" "}
                      {new Date(budgie.updatedAt).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
