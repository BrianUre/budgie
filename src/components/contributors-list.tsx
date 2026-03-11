"use client";

import { useState } from "react";
import Image from "next/image";
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
import { Button } from "@/components/ui/button";
import { AddContributorDialog } from "@/components/add-contributor-dialog";
import { api } from "@/lib/trpc/client";
import { UserX, X } from "lucide-react";

type ContributorItem = {
  id: string;
  name: string | null;
  user?: {
    email?: string | null;
    name?: string | null;
    imageUrl?: string | null;
  } | null;
};

type PendingInvitationItem = {
  id: string;
  email: string;
  createdAt: Date;
  user?: { name: string | null; imageUrl: string | null } | null;
};

function displayName(c: ContributorItem): string {
  return c.user?.name ?? c.user?.email ?? c.name ?? "—";
}

function contributorInitials(c: ContributorItem): string {
  const name = displayName(c);
  if (name === "—") return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0]![0] + parts[parts.length - 1]![0])
      .toUpperCase()
      .slice(0, 2);
  }
  return name.slice(0, 2).toUpperCase();
}

function invitationInitials(inv: PendingInvitationItem): string {
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

export function ContributorsList({
  budgieId,
  contributors,
  pendingInvitations = [],
  isAdmin,
}: {
  budgieId: string;
  contributors: ContributorItem[];
  pendingInvitations?: PendingInvitationItem[];
  isAdmin: boolean;
}) {
  const utils = api.useUtils();
  const [removeDialogContributorId, setRemoveDialogContributorId] = useState<
    string | null
  >(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const removeMutation = api.contributor.remove.useMutation({
    onSuccess: () => {
      void utils.contributor.list.invalidate({ budgieId });
      setRemoveDialogContributorId(null);
    },
  });

  const cancelMutation = api.invitation.cancel.useMutation({
    onSuccess: () => {
      void utils.invitation.listPendingForBudgie.invalidate({ budgieId });
      setCancellingId(null);
    },
    onError: () => setCancellingId(null),
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
        {isAdmin && <AddContributorDialog budgieId={budgieId} />}
      </CardHeader>
      <CardContent className="space-y-6">
        <section>
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">
            Contributors
          </h3>
          <ul className="space-y-2 text-sm">
            {contributors.map((contributor) => (
              <li
                key={contributor.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                  {contributor.user?.imageUrl ? (
                    <Image
                      src={contributor.user.imageUrl}
                      alt=""
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium text-muted-foreground">
                      {contributorInitials(contributor)}
                    </span>
                  )}
                </div>
                <span className="min-w-0 flex-1 truncate font-medium">
                  {displayName(contributor)}
                </span>
                {isAdmin && (
                  <Dialog
                    open={removeDialogContributorId === contributor.id}
                    onOpenChange={(open) =>
                      !open && setRemoveDialogContributorId(null)
                    }
                  >
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                        aria-label={`Remove ${displayName(contributor)}`}
                        title={`Remove ${displayName(contributor)}`}
                        onClick={() =>
                          setRemoveDialogContributorId(contributor.id)
                        }
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <div className="flex items-center gap-2">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                            <UserX className="h-4 w-4" />
                          </div>
                          <DialogTitle>Remove collaborator?</DialogTitle>
                        </div>
                        <DialogDescription>
                          This will remove {displayName(contributor)} from this
                          budgie. They will no longer have access.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setRemoveDialogContributorId(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        disabled={removeMutation.isPending}
                        onClick={() => {
                          removeMutation.mutate({
                            budgieId,
                            contributorId: contributor.id,
                          });
                        }}
                      >
                        {removeMutation.isPending ? "Removing…" : "Remove"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </li>
          ))}
          {contributors.length === 0 && (
            <li className="rounded-lg border border-dashed p-4 text-center text-muted-foreground">
              No contributors yet.
            </li>
          )}
        </ul>
        </section>

        {isAdmin && (
          <section>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">
              Pending invitations
            </h3>
            {pendingInvitations.length === 0 ? (
              <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                No pending invitations.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {pendingInvitations.map((inv) => (
                  <li
                    key={inv.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                      {inv.user?.imageUrl ? (
                        <Image
                          src={inv.user.imageUrl}
                          alt=""
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-medium text-muted-foreground">
                          {invitationInitials(inv)}
                        </span>
                      )}
                    </div>
                    <span className="min-w-0 flex-1 truncate font-medium">
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
                      aria-label={`Cancel invitation for ${inv.email}`}
                      title={`Cancel invitation for ${inv.email}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </CardContent>
    </Card>
  );
}
