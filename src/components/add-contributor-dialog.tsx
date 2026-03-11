"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "@tanstack/react-form";
import { api } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, X } from "lucide-react";

type AddMode = "person" | "entity";

function invitationInitials(inv: {
  email: string;
  user?: { name: string | null } | null;
}): string {
  const name = inv.user?.name ?? inv.email;
  if (!name.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0]![0] + parts[parts.length - 1]![0])
      .toUpperCase()
      .slice(0, 2);
  }
  return name.slice(0, 2).toUpperCase();
}

export function AddContributorDialog({
  budgieId,
  contributorEmails = [],
}: {
  budgieId: string;
  contributorEmails?: string[];
}) {
  const utils = api.useUtils();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<AddMode>("person");

  const { data: pendingInvitations = [] } =
    api.invitation.listPendingForBudgie.useQuery(
      { budgieId },
      { enabled: !!budgieId }
    );

  const contributorMutation = api.contributor.add.useMutation({
    onSuccess: () => {
      void utils.contributor.list.invalidate({ budgieId });
      setDialogOpen(false);
    },
  });

  const invitationMutation = api.invitation.createForBudgie.useMutation({
    onSuccess: () => {
      void utils.invitation.listPendingForBudgie.invalidate({ budgieId });
      setDialogOpen(false);
    },
  });

  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const cancelMutation = api.invitation.cancel.useMutation({
    onSuccess: () => {
      void utils.invitation.listPendingForBudgie.invalidate({ budgieId });
      setCancellingId(null);
    },
    onError: () => setCancellingId(null),
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
      try {
        await invitationMutation.mutateAsync({
          budgieId,
          inviteeEmail: value.inviteeEmail.trim(),
          invitationMessage: value.invitationMessage.trim() || undefined,
        });
      } catch (err) {
        // CONFLICT (duplicate) is handled by invalidating and showing server message
        throw err;
      }
    },
  });

  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setMode("person");
      entityForm.reset();
      personForm.reset();
    }
  };

  const handleTabChange = (value: string) => {
    setMode(value as AddMode);
    entityForm.reset();
    personForm.reset();
  };

  const isEmailTaken = (email: string) => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return false;
    const inContributors = contributorEmails.some(
      (e) => e.trim().toLowerCase() === normalized
    );
    const inPending = pendingInvitations.some(
      (p) => p.email.trim().toLowerCase() === normalized
    );
    return inContributors || inPending;
  };

  return (
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
            Invite a person by email or add a symbolic entity (e.g. landlord).
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={mode}
          onValueChange={handleTabChange}
          defaultValue="person"
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="person">Invite somebody</TabsTrigger>
            <TabsTrigger value="entity">Add entity</TabsTrigger>
          </TabsList>
          <TabsContent value="person" className="mt-4 space-y-4">
            <div className="grid gap-2">
              <h4 className="text-sm font-medium">Pending invitations</h4>
              {pendingInvitations.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No pending invitations.
                </p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {pendingInvitations.map((inv) => (
                    <li
                      key={inv.id}
                      className="flex items-center gap-3 rounded-md border px-2 py-1.5"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                        {inv.user?.imageUrl ? (
                          <Image
                            src={inv.user.imageUrl}
                            alt=""
                            width={32}
                            height={32}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-medium text-muted-foreground">
                            {invitationInitials(inv)}
                          </span>
                        )}
                      </div>
                      <span className="min-w-0 flex-1 truncate">
                        {inv.user?.name ?? inv.email}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                        disabled={cancellingId === inv.id}
                        onClick={() => {
                          setCancellingId(inv.id);
                          cancelMutation.mutate(
                            { invitationId: inv.id },
                            {
                              onError: (err) => {
                                const message =
                                  err.message ?? "Failed to cancel invitation";
                                console.error(message);
                              },
                            }
                          );
                        }}
                        aria-label='Cancel invitation'
                        title='Cancel invitation'
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                personForm.handleSubmit();
              }}
            >
              <div className="grid gap-4 py-4">
                <personForm.Field
                  name="inviteeEmail"
                  validators={{
                    onChange: ({ value }) => {
                      if (isEmailTaken(String(value ?? ""))) {
                        return "This email is already a contributor or has a pending invitation.";
                      }
                      return undefined;
                    },
                  }}
                >
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
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-destructive text-sm">
                          {field.state.meta.errors.join(", ")}
                        </p>
                      )}
                      {invitationMutation.isError &&
                        invitationMutation.error.data?.code === "CONFLICT" && (
                          <p className="text-destructive text-sm">
                            {invitationMutation.error.message}
                          </p>
                        )}
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
                <personForm.Subscribe
                  selector={(state) => [
                    state.values.inviteeEmail,
                    state.isSubmitting,
                  ]}
                >
                  {([inviteeEmail, isSubmitting]) => {
                    const disabled =
                      Boolean(invitationMutation.isPending) ||
                      Boolean(isSubmitting) ||
                      isEmailTaken(String(inviteeEmail ?? ""));
                    return (
                      <Button type="submit" disabled={disabled}>
                        {invitationMutation.isPending || isSubmitting
                          ? "Sending…"
                          : "Send invitation"}
                      </Button>
                    );
                  }}
                </personForm.Subscribe>
              </DialogFooter>
            </form>
          </TabsContent>
          <TabsContent value="entity" className="mt-4">
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
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
