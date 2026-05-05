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
import { AddCategoryDialog } from "@/components/add-category-dialog";
import type { Category } from "@/app/budgie/[id]/budgie-detail-context";
import { api } from "@/lib/trpc/client";
import { Pencil, Trash2 } from "lucide-react";

export function CategoriesCard({
  budgieId,
  isAdmin,
  categories,
}: {
  budgieId: string;
  isAdmin: boolean;
  categories: Category[];
}) {
  const utils = api.useUtils();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const updateMutation = api.category.update.useMutation({
    onSuccess: () => {
      void utils.category.list.invalidate({ budgieId });
      setEditingId(null);
    },
  });

  const deleteMutation = api.category.delete.useMutation({
    onSuccess: () => {
      void utils.category.list.invalidate({ budgieId });
      setDeleteTargetId(null);
    },
  });

  const startEditing = (category: Category) => {
    setEditingId(category.id);
    setEditName(category.name ?? "");
    setEditColor(category.color);
  };

  const cancelEditing = () => setEditingId(null);

  const saveEditing = () => {
    if (!editingId) return;
    const name = editName.trim();
    if (!name) return;
    updateMutation.mutate({
      id: editingId,
      name,
      color: editColor,
    });
  };

  const costCount = (category: Category) =>
    category._count?.costCategories ?? 0;
  const isUsed = (category: Category) => costCount(category) > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Categories</CardTitle>
          <CardDescription>
            Categories can be assigned to costs and used to filter the payments
            view.
          </CardDescription>
        </div>
        {isAdmin && <AddCategoryDialog budgieId={budgieId} />}
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No categories yet.
            {isAdmin && " Add one to start grouping your costs."}
          </p>
        ) : (
          <ul className="space-y-2">
            {categories.map((category) => (
              <li key={category.id} className="rounded-lg border p-3">
                {editingId === category.id ? (
                  <div className="space-y-3">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Name"
                      className="h-8"
                    />
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        className="h-8 w-16 cursor-pointer p-1"
                      />
                      <span className="font-mono text-sm text-muted-foreground">
                        {editColor}
                      </span>
                    </div>
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
                          !editName.trim() || updateMutation.isPending
                        }
                        onClick={saveEditing}
                      >
                        {updateMutation.isPending ? "Saving…" : "Save"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-4 w-4 rounded-full border"
                        style={{ backgroundColor: category.color }}
                        aria-hidden
                      />
                      <p className="font-medium">{category.name ?? "—"}</p>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label={`Edit ${category.name ?? "category"}`}
                          onClick={() => startEditing(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {isUsed(category) ? (
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
                                This category is in use and cannot be deleted.
                              </p>
                            </HoverCardContent>
                          </HoverCard>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            aria-label={`Delete ${category.name ?? "category"}`}
                            onClick={() => setDeleteTargetId(category.id)}
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
            <DialogTitle>Delete category?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The category will be removed from
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
