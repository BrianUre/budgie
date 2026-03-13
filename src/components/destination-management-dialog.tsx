"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { api } from "@/lib/trpc/client";
import type { DestinationListItem } from "@/server/api/routers/destination";
import type { DestinationType } from "@/types/destination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil } from "lucide-react";

const DESTINATION_TYPE_OPTIONS: { value: DestinationType; label: string }[] = [
  { value: "bank_account", label: "Bank account" },
  { value: "bizum", label: "Bizum" },
];

interface DestinationManagementDialogProps {
  budgieId: string;
  trigger?: React.ReactNode;
}

export function DestinationManagementDialog({
  budgieId,
  trigger,
}: DestinationManagementDialogProps) {
  const utils = api.useUtils();
  const { data: destinations = [] } = api.destination.list.useQuery(
    { budgieId },
    { enabled: !!budgieId }
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRecipientName, setEditRecipientName] = useState("");
  const [editType, setEditType] = useState<DestinationType>("bank_account");
  const [editIban, setEditIban] = useState("");
  const [editSwift, setEditSwift] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const createMutation = api.destination.create.useMutation({
    onSuccess: () => {
      void utils.destination.list.invalidate({ budgieId });
    },
  });

  const updateMutation = api.destination.update.useMutation({
    onSuccess: () => {
      void utils.destination.list.invalidate({ budgieId });
      setEditingId(null);
    },
  });

  const form = useForm({
    defaultValues: {
      name: "",
      recipientName: "",
      type: "bank_account" as DestinationType,
      iban: "",
      swift: "",
      phone: "",
    },
    onSubmit: async ({ value }) => {
      const name = value.name.trim();
      const recipientName = value.recipientName.trim() || name;
      if (!name || !recipientName) return;
      await createMutation.mutateAsync({
        budgieId,
        name,
        recipientName,
        type: value.type,
        iban: value.iban?.trim() ?? null,
        swift: value.swift?.trim() ?? null,
        phone: value.phone?.trim() ?? null,
      });
      form.reset();
    },
  });

  const startEditing = (destination: DestinationListItem) => {
    setEditingId(destination.id);
    setEditName(destination.name);
    setEditRecipientName(destination.recipientName ?? destination.name);
    setEditType((destination.type as DestinationType) ?? "bank_account");
    setEditIban(destination.iban ?? "");
    setEditSwift(destination.swift ?? "");
    setEditPhone(destination.phone ?? "");
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

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

  const defaultTrigger = (
    <Button type="button" variant="outline" size="sm">
      Manage destinations
    </Button>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Destinations</DialogTitle>
          <DialogDescription>
            Add and manage destinations for this budgie. Destinations can be
            assigned to costs and used for payment tracking.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto py-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Add new destination</Label>
              <div className="flex flex-col gap-3">
                <form.Field name="name">
                  {(field) => (
                    <div className="space-y-1">
                      <Label htmlFor="add-name" className="text-xs">Name</Label>
                      <Input
                        id="add-name"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="e.g. Landlord, Utilities"
                      />
                    </div>
                  )}
                </form.Field>
                <form.Field name="recipientName">
                  {(field) => (
                    <div className="space-y-1">
                      <Label htmlFor="add-recipientName" className="text-xs">Recipient name</Label>
                      <Input
                        id="add-recipientName"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Optional, defaults to Name"
                      />
                    </div>
                  )}
                </form.Field>
                <form.Field name="type">
                  {(field) => (
                    <div className="space-y-1">
                      <Label className="text-xs">Type</Label>
                      <Select
                        value={field.state.value}
                        onValueChange={(v) => field.handleChange(v as DestinationType)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {DESTINATION_TYPE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </form.Field>
                <form.Subscribe selector={(state) => state.values.type}>
                  {(type) =>
                    type === "bizum" ? (
                      <form.Field name="phone">
                        {(field) => (
                          <div className="space-y-1">
                            <Label htmlFor="add-phone" className="text-xs">Phone (optional)</Label>
                            <Input
                              id="add-phone"
                              value={field.state.value}
                              onChange={(e) => field.handleChange(e.target.value)}
                              placeholder="Phone"
                            />
                          </div>
                        )}
                      </form.Field>
                    ) : (
                      <>
                        <form.Field name="iban">
                          {(field) => (
                            <div className="space-y-1">
                              <Label htmlFor="add-iban" className="text-xs">IBAN (optional)</Label>
                              <Input
                                id="add-iban"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="IBAN"
                                className="font-mono"
                              />
                            </div>
                          )}
                        </form.Field>
                        <form.Field name="swift">
                          {(field) => (
                            <div className="space-y-1">
                              <Label htmlFor="add-swift" className="text-xs">SWIFT (optional)</Label>
                              <Input
                                id="add-swift"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="SWIFT"
                                className="font-mono"
                              />
                            </div>
                          )}
                        </form.Field>
                      </>
                    )
                  }
                </form.Subscribe>
                <form.Subscribe
                  selector={(state) => [
                    state.values.name,
                    state.values.recipientName,
                    state.values.type,
                    state.isSubmitting,
                  ]}
                >
                  {([name, recipientName, type, isSubmitting]) => {
                    const n = typeof name === "string" ? name.trim() : "";
                    const r = typeof recipientName === "string" ? recipientName.trim() : n;
                    const valid = n.length > 0 && (r.length > 0 || n.length > 0);
                    return (
                      <Button
                        type="submit"
                        size="sm"
                        disabled={Boolean(
                          isSubmitting || createMutation.isPending || !valid
                        )}
                      >
                        {createMutation.isPending ? "Adding…" : "Add"}
                      </Button>
                    );
                  }}
                </form.Subscribe>
              </div>
            </div>
          </form>

          <div className="space-y-2">
            <Label>Destinations</Label>
            {destinations.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No destinations yet. Add one above.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead className="w-[80px]"> </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {destinations.map((d) => (
                    <TableRow key={d.id}>
                      {editingId === d.id ? (
                        <>
                          <TableCell>
                            <div className="space-y-1">
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
                          </TableCell>
                          <TableCell>
                            <Select
                              value={editType}
                              onValueChange={(v) => setEditType(v as DestinationType)}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {DESTINATION_TYPE_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {editType === "bizum" ? (
                              <Input
                                value={editPhone}
                                onChange={(e) => setEditPhone(e.target.value)}
                                placeholder="Phone"
                                className="h-8"
                              />
                            ) : (
                              <div className="flex flex-col gap-1">
                                <Input
                                  value={editIban}
                                  onChange={(e) => setEditIban(e.target.value)}
                                  placeholder="IBAN"
                                  className="h-8 font-mono"
                                />
                                <Input
                                  value={editSwift}
                                  onChange={(e) => setEditSwift(e.target.value)}
                                  placeholder="SWIFT"
                                  className="h-8 font-mono"
                                />
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="h-8 px-2"
                                onClick={cancelEditing}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                className="h-8 px-2"
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
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>
                            <div className="font-medium">{d.name}</div>
                            {d.recipientName && d.recipientName !== d.name && (
                              <div className="text-muted-foreground text-xs">
                                {d.recipientName}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-muted-foreground text-sm">
                              {DESTINATION_TYPE_OPTIONS.find((o) => o.value === d.type)?.label ?? d.type}
                            </span>
                          </TableCell>
                          <TableCell className="font-mono text-muted-foreground text-sm">
                            {d.type === "bizum"
                              ? (d.phone?.trim() ?? "—")
                              : [d.iban?.trim(), d.swift?.trim()]
                                  .filter(Boolean)
                                  .join(" / ") || "—"}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label={`Edit ${d.name}`}
                              onClick={() => startEditing(d)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
