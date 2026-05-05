"use client";

import type { ReactNode } from "react";
import { useForm } from "@tanstack/react-form";
import { api } from "@/lib/trpc/client";
import { DEFAULT_CATEGORY_COLOR } from "@/types/category";
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

interface AddCategoryDialogProps {
  /** Budgie to add the category to. */
  budgieId: string;
  /** Optional trigger element; defaults to an "Add category" button. */
  trigger?: ReactNode;
}

/**
 * Dialog to add a new category to a budgie. Categories can be assigned to
 * costs and used to filter the payments view.
 */
export function AddCategoryDialog({
  budgieId,
  trigger,
}: AddCategoryDialogProps) {
  const utils = api.useUtils();

  const createMutation = api.category.create.useMutation({
    onSuccess: () => {
      void utils.category.list.invalidate({ budgieId });
    },
  });

  const form = useForm({
    defaultValues: {
      name: "",
      color: DEFAULT_CATEGORY_COLOR,
    },
    onSubmit: async ({ value }) => {
      const name = value.name.trim();
      if (!name) return;
      await createMutation.mutateAsync({
        budgieId,
        name,
        color: value.color,
      });
      form.reset();
    },
  });

  const defaultTrigger = (
    <Button type="button" variant="outline" size="sm">
      Add category
    </Button>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add category</DialogTitle>
          <DialogDescription>
            Categories let you group costs (e.g. Bills, Subscriptions) and
            filter the payments view by category.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto py-4 px-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-4"
          >
            <div className="flex flex-col gap-3">
              <form.Field name="name">
                {(field) => (
                  <div className="space-y-1">
                    <Label htmlFor="add-category-name" className="text-xs">
                      Name
                    </Label>
                    <Input
                      id="add-category-name"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g. Bills, Subscriptions"
                    />
                  </div>
                )}
              </form.Field>
              <form.Field name="color">
                {(field) => (
                  <div className="space-y-1">
                    <Label htmlFor="add-category-color" className="text-xs">
                      Color
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="add-category-color"
                        type="color"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="h-9 w-16 cursor-pointer p-1"
                      />
                      <span className="font-mono text-sm text-muted-foreground">
                        {field.state.value}
                      </span>
                    </div>
                  </div>
                )}
              </form.Field>
              <form.Subscribe
                selector={(state) => [
                  state.values.name,
                  state.isSubmitting,
                ]}
              >
                {([name, isSubmitting]) => {
                  const trimmed = typeof name === "string" ? name.trim() : "";
                  const valid = trimmed.length > 0;
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
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
