"use client";

import type { ReactNode } from "react";
import { useForm } from "@tanstack/react-form";
import { api } from "@/lib/trpc/client";
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

const DESTINATION_TYPE_OPTIONS: { value: DestinationType; label: string }[] = [
  { value: "bank_account", label: "Bank account" },
  { value: "bizum", label: "Bizum" },
];

/**
 * Props for the Add Destination dialog.
 */
interface AddDestinationDialogProps {
  /** Budgie to add the destination to. */
  budgieId: string;
  /** Optional trigger element; defaults to an "Add destination" button. */
  trigger?: ReactNode;
}

/**
 * Dialog to add a new destination (bank account or Bizum) to a budgie.
 * Destinations can be assigned to costs for payment tracking.
 */
export function AddDestinationDialog({
  budgieId,
  trigger,
}: AddDestinationDialogProps) {
  const utils = api.useUtils();

  const createMutation = api.destination.create.useMutation({
    onSuccess: () => {
      void utils.destination.list.invalidate({ budgieId });
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

  const defaultTrigger = (
    <Button type="button" variant="outline" size="sm">
      Add destination
    </Button>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add destination</DialogTitle>
          <DialogDescription>
            Add a destination for this budgie. Destinations can be assigned to
            costs and used for payment tracking.
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
              <div className="flex flex-col gap-3">
                <form.Field name="name">
                  {(field) => (
                    <div className="space-y-1">
                      <Label htmlFor="add-name" className="text-xs">
                        Name
                      </Label>
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
                      <Label htmlFor="add-recipientName" className="text-xs">
                        Recipient name
                      </Label>
                      <Input
                        id="add-recipientName"
                        value={field.state.value}
                        onChange={(e) =>
                          field.handleChange(e.target.value)
                        }
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
                        onValueChange={(v) =>
                          field.handleChange(v as DestinationType)
                        }
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
                            <Label
                              htmlFor="add-phone"
                              className="text-xs"
                            >
                              Phone (optional)
                            </Label>
                            <Input
                              id="add-phone"
                              value={field.state.value}
                              onChange={(e) =>
                                field.handleChange(e.target.value)
                              }
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
                              <Label
                                htmlFor="add-iban"
                                className="text-xs"
                              >
                                IBAN (optional)
                              </Label>
                              <Input
                                id="add-iban"
                                value={field.state.value}
                                onChange={(e) =>
                                  field.handleChange(e.target.value)
                                }
                                placeholder="IBAN"
                                className="font-mono"
                              />
                            </div>
                          )}
                        </form.Field>
                        <form.Field name="swift">
                          {(field) => (
                            <div className="space-y-1">
                              <Label
                                htmlFor="add-swift"
                                className="text-xs"
                              >
                                SWIFT (optional)
                              </Label>
                              <Input
                                id="add-swift"
                                value={field.state.value}
                                onChange={(e) =>
                                  field.handleChange(e.target.value)
                                }
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
                    const n =
                      typeof name === "string" ? name.trim() : "";
                    const r =
                      typeof recipientName === "string"
                        ? recipientName.trim()
                        : n;
                    const valid =
                      n.length > 0 && (r.length > 0 || n.length > 0);
                    return (
                      <Button
                        type="submit"
                        size="sm"
                        disabled={Boolean(
                          isSubmitting ||
                            createMutation.isPending ||
                            !valid
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
