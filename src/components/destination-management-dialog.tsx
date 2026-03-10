"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { api } from "@/lib/trpc/client";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil } from "lucide-react";

type DestinationRow = {
  id: string;
  name: string;
  iban?: string | null;
};

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
  const [editIban, setEditIban] = useState("");

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
    defaultValues: { name: "", iban: "" },
    onSubmit: async ({ value }) => {
      const name = value.name.trim();
      if (!name) return;
      await createMutation.mutateAsync({
        budgieId,
        name,
        iban: value.iban?.trim() || null,
      });
      form.reset();
    },
  });

  const startEditing = (d: DestinationRow) => {
    setEditingId(d.id);
    setEditName(d.name);
    setEditIban(d.iban ?? "");
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const saveEditing = () => {
    if (!editingId) return;
    const name = editName.trim();
    if (!name) return;
    updateMutation.mutate({
      id: editingId,
      name,
      iban: editIban.trim() || null,
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
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <form.Field name="name">
                  {(field) => (
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g. Landlord, Utilities"
                      className="flex-1"
                    />
                  )}
                </form.Field>
                <form.Field name="iban">
                  {(field) => (
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="IBAN (optional)"
                      className="flex-1 font-mono"
                    />
                  )}
                </form.Field>
                <form.Subscribe
                  selector={(state) => [
                    state.values.name,
                    state.isSubmitting,
                  ]}
                >
                  {([name, isSubmitting]) => (
                    <Button
                      type="submit"
                      size="sm"
                      disabled={Boolean(
                        isSubmitting ||
                          createMutation.isPending ||
                          (typeof name !== "string" || !String(name).trim())
                      )}
                    >
                      {createMutation.isPending ? "Adding…" : "Add"}
                    </Button>
                  )}
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
                    <TableHead>IBAN</TableHead>
                    <TableHead className="w-[80px]"> </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(destinations as DestinationRow[]).map((d) => (
                    <TableRow key={d.id}>
                      {editingId === d.id ? (
                        <>
                          <TableCell>
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              placeholder="Name"
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={editIban}
                              onChange={(e) => setEditIban(e.target.value)}
                              placeholder="IBAN"
                              className="h-8 font-mono"
                            />
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
                                  !editName.trim() || updateMutation.isPending
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
                          <TableCell className="font-medium">{d.name}</TableCell>
                          <TableCell className="font-mono text-muted-foreground text-sm">
                            {d.iban?.trim() ?? "—"}
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
