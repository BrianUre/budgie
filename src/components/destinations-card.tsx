"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddDestinationDialog } from "@/components/add-destination-dialog";
import type { Destination } from "@/app/budgie/[id]/budgie-detail-context";
import type { DestinationType } from "@/types/destination";
import { api } from "@/lib/trpc/client";
import { Pencil, Trash2 } from "lucide-react";

const TYPE_LABELS: Record<DestinationType, string> = {
  bank_account: "Bank account",
  bizum: "Bizum",
};

export function DestinationsCard({
  budgieId,
  isAdmin,
  destinations,
}: {
  budgieId: string;
  isAdmin: boolean;
  destinations: Destination[];
}) {
  const utils = api.useUtils();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRecipientName, setEditRecipientName] = useState("");
  const [editType, setEditType] = useState<DestinationType>("bank_account");
  const [editIban, setEditIban] = useState("");
  const [editSwift, setEditSwift] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const updateMutation = api.destination.update.useMutation({
    onSuccess: () => {
      void utils.destination.list.invalidate({ budgieId });
      setEditingId(null);
    },
  });

  const deleteMutation = api.destination.delete.useMutation({
    onSuccess: () => {
      void utils.destination.list.invalidate({ budgieId });
      setDeleteTargetId(null);
    },
  });

  const startEditing = (destination: Destination) => {
    setEditingId(destination.id);
    setEditName(destination.name ?? "");
    setEditRecipientName(destination.recipientName ?? destination.name ?? "");
    setEditType((destination.type as DestinationType) ?? "bank_account");
    setEditIban(destination.iban ?? "");
    setEditSwift(destination.swift ?? "");
    setEditPhone(destination.phone ?? "");
  };

  const cancelEditing = () => setEditingId(null);

  const saveEditing = () => {
    if (!editingId) return;
    const name = editName.trim();
    const recipientName = editRecipientName.trim() || name;
    if (!name || !recipientName) return;
    updateMutation.mutate({
      id: editingId,
      name,
      recipientName,
      type: editType,
      iban: editType === "bank_account" ? editIban.trim() || null : null,
      swift: editType === "bank_account" ? editSwift.trim() || null : null,
      phone: editType === "bizum" ? editPhone.trim() || null : null,
    });
  };

  const costCount = (destination: Destination) => destination._count?.costs ?? 0;
  const isUsed = (destination: Destination) => costCount(destination) > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Destinations</CardTitle>
          <CardDescription>
            Destinations can be assigned to costs for payment tracking.
          </CardDescription>
        </div>
        {isAdmin && (
          <AddDestinationDialog budgieId={budgieId} />
        )}
      </CardHeader>
      <CardContent>
        {destinations.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No destinations yet.
            {isAdmin && " Open Manage destinations to add one."}
          </p>
        ) : (
          <ul className="space-y-2">
            {destinations.map((destination) => (
              <li
                key={destination.id}
                className="rounded-lg border p-3"
              >
                {editingId === destination.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Name"
                        className="h-8"
                      />
                      <Input
                        value={editRecipientName}
                        onChange={(e) => setEditRecipientName(e.target.value)}
                        placeholder="Recipient name"
                        className="h-8"
                      />
                    </div>
                    <Select
                      value={editType}
                      onValueChange={(v) => setEditType(v as DestinationType)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank_account">Bank account</SelectItem>
                        <SelectItem value="bizum">Bizum</SelectItem>
                      </SelectContent>
                    </Select>
                    {editType === "bizum" ? (
                      <Input
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="Phone (optional)"
                        className="h-8"
                      />
                    ) : (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <Input
                          value={editIban}
                          onChange={(e) => setEditIban(e.target.value)}
                          placeholder="IBAN (optional)"
                          className="h-8 font-mono"
                        />
                        <Input
                          value={editSwift}
                          onChange={(e) => setEditSwift(e.target.value)}
                          placeholder="SWIFT (optional)"
                          className="h-8 font-mono"
                        />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={cancelEditing}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={
                          !editName.trim() ||
                          !(editRecipientName.trim() || editName.trim()) ||
                          updateMutation.isPending
                        }
                        onClick={saveEditing}
                      >
                        {updateMutation.isPending ? "Saving…" : "Save"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{destination.name ?? "—"}</p>
                        <span className="rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground">
                          {TYPE_LABELS[(destination.type as DestinationType) ?? "bank_account"] ?? destination.type}
                        </span>
                      </div>
                      {destination.recipientName && destination.recipientName !== destination.name && (
                        <p className="text-muted-foreground text-sm">
                          {destination.recipientName}
                        </p>
                      )}
                      <p className="mt-1 text-sm text-muted-foreground">
                        {destination.type === "bizum"
                          ? (destination.phone?.trim() ? (
                              <span className="font-mono">{destination.phone}</span>
                            ) : (
                              "No phone"
                            ))
                          : (
                            <>
                              {destination.iban?.trim() ? (
                                <span className="font-mono">{destination.iban}</span>
                              ) : (
                                "No IBAN"
                              )}
                              {destination.swift?.trim() && (
                                <span className="ml-2 font-mono">{destination.swift}</span>
                              )}
                            </>
                          )}
                      </p>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label={`Edit ${destination.name ?? "destination"}`}
                          onClick={() => startEditing(destination)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {isUsed(destination) ? (
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <span className="inline-flex">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 cursor-not-allowed"
                                  aria-label="Delete (disabled: in use)"
                                  disabled
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </span>
                            </HoverCardTrigger>
                            <HoverCardContent>
                              <p className="text-sm">
                                This destination is in use and cannot be deleted.
                              </p>
                            </HoverCardContent>
                          </HoverCard>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            aria-label={`Delete ${destination.name ?? "destination"}`}
                            onClick={() => setDeleteTargetId(destination.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Dialog
        open={!!deleteTargetId}
        onOpenChange={(open) => !open && setDeleteTargetId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete destination?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The destination will be removed from
              this budgie.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTargetId(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (deleteTargetId) {
                  deleteMutation.mutate({ id: deleteTargetId });
                }
              }}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
