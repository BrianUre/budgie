"use client";

import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
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

interface CreateBudgieDialogProps {
  trigger: React.ReactNode;
  title?: string;
  description?: string;
}

export function CreateBudgieDialog({
  trigger,
  title = "Create a budgie",
  description = "Give your budget sheet a name. You can change it later.",
}: CreateBudgieDialogProps) {
  const router = useRouter();
  const utils = api.useUtils();
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

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
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
            <form.Subscribe
              selector={(state): [string, boolean] => [
                state.values.name,
                state.isSubmitting,
              ]}
            >
              {([name, isSubmitting]) => (
                <Button type="submit" disabled={isSubmitting || !name.trim()}>
                  {isSubmitting ? "Creating…" : "Create"}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
