"use client";

import { useState } from "react";
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

type AddMode = "person" | "entity";

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<AddMode>("entity");

  const contributorMutation = api.contributor.add.useMutation({
    onSuccess: () => {
      void utils.contributor.list.invalidate({ budgieId });
      setDialogOpen(false);
    },
  });

  const invitationMutation = api.invitation.createForBudgie.useMutation({
    onSuccess: () => {
      setDialogOpen(false);
    },
  });

  const entityForm = useForm({
    defaultValues: { name: "" },
    onSubmit: async ({ value }) => {
      await contributorMutation.mutateAsync({
        budgieId,
        name: value.name.trim() || undefined,
      });
    },
  });

  const personForm = useForm({
    defaultValues: { inviteeEmail: "", invitationMessage: "" },
    onSubmit: async ({ value }) => {
      await invitationMutation.mutateAsync({
        budgieId,
        inviteeEmail: value.inviteeEmail.trim(),
        invitationMessage: value.invitationMessage.trim() || undefined,
      });
    },
  });

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setMode("entity");
      entityForm.reset();
      personForm.reset();
    }
  };

  const handleModeChange = (newMode: AddMode) => {
    setMode(newMode);
    entityForm.reset();
    personForm.reset();
  };

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
          <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Add contributor
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add contributor</DialogTitle>
                <DialogDescription>
                  Invite a person by email or add a symbolic entity (e.g.
                  landlord).
                </DialogDescription>
              </DialogHeader>

              <div className="flex gap-2 py-2">
                <Button
                  type="button"
                  variant={mode === "person" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleModeChange("person")}
                >
                  Invite a person
                </Button>
                <Button
                  type="button"
                  variant={mode === "entity" ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleModeChange("entity")}
                >
                  Add entity
                </Button>
              </div>

              {mode === "person" ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    personForm.handleSubmit();
                  }}
                >
                  <div className="grid gap-4 py-4">
                    <personForm.Field name="inviteeEmail">
                      {(field) => (
                        <div className="grid gap-2">
                          <Label htmlFor="inviteeEmail">Email</Label>
                          <Input
                            id="inviteeEmail"
                            type="email"
                            required
                            value={field.state.value}
                            onChange={(e) =>
                              field.handleChange(e.target.value)
                            }
                            placeholder="colleague@example.com"
                          />
                        </div>
                      )}
                    </personForm.Field>
                    <personForm.Field name="invitationMessage">
                      {(field) => (
                        <div className="grid gap-2">
                          <Label htmlFor="invitationMessage">
                            Message (optional)
                          </Label>
                          <Input
                            id="invitationMessage"
                            value={field.state.value}
                            onChange={(e) =>
                              field.handleChange(e.target.value)
                            }
                            placeholder="A short note to the invitee"
                          />
                        </div>
                      )}
                    </personForm.Field>
                  </div>
                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={invitationMutation.isPending}
                    >
                      {invitationMutation.isPending
                        ? "Sending…"
                        : "Send invitation"}
                    </Button>
                  </DialogFooter>
                </form>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    entityForm.handleSubmit();
                  }}
                >
                  <div className="grid gap-4 py-4">
                    <entityForm.Field name="name">
                      {(field) => (
                        <div className="grid gap-2">
                          <Label htmlFor="entityName">Name</Label>
                          <Input
                            id="entityName"
                            value={field.state.value}
                            onChange={(e) =>
                              field.handleChange(e.target.value)
                            }
                            placeholder="e.g. Landlord"
                            required
                          />
                        </div>
                      )}
                    </entityForm.Field>
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
              )}
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
