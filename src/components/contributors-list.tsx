"use client";

import { useForm } from "@tanstack/react-form";
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

export function ContributorsList({
  budgieId,
  contributors,
  isAdmin,
}: {
  budgieId: string;
  contributors: Array<{
    id: string;
    name: string | null;
    user?: { email: string } | null;
  }>;
  isAdmin: boolean;
}) {
  const utils = api.useUtils();
  const contributorMutation = api.contributor.add.useMutation({
    onSuccess: () => {
      void utils.contributor.list.invalidate({ budgieId });
    },
  });

  const contributorForm = useForm({
    defaultValues: { name: "", linkToUserId: "" },
    onSubmit: async ({ value }) => {
      await contributorMutation.mutateAsync({
        budgieId,
        name: value.name || undefined,
        userId: value.linkToUserId || undefined,
      });
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Contributors</CardTitle>
          <CardDescription>
            People and entities that share costs. Percentages are set per cost
            below.
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
                    Add a symbolic entity (e.g. landlord) or link to an existing
                    user.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <contributorForm.Field name="name">
                    {(field) => (
                      <div className="grid gap-2">
                        <Label>Name</Label>
                        <Input
                          value={field.state.value}
                          onChange={(e) =>
                            field.handleChange(e.target.value)
                          }
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
  );
}
