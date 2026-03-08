"use client";

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

  const createMutation = api.destination.create.useMutation({
    onSuccess: () => {
      void utils.destination.list.invalidate({ budgieId });
    },
  });

  const form = useForm({
    defaultValues: { name: "" },
    onSubmit: async ({ value }) => {
      const name = value.name.trim();
      if (!name) return;
      await createMutation.mutateAsync({ budgieId, name });
      form.reset();
    },
  });

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
              <div className="flex gap-2">
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {destinations.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.name}</TableCell>
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
