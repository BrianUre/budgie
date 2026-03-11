"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

export type ContributorColumnHeaderContributor = {
  id: string;
  name: string | null;
  userId?: string | null;
  user?: {
    name?: string | null;
    email?: string | null;
    imageUrl?: string | null;
  } | null;
};

function displayName(c: ContributorColumnHeaderContributor): string {
  return c.user?.name ?? c.user?.email ?? c.name ?? "—";
}

function initials(c: ContributorColumnHeaderContributor): string {
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

export function ContributorColumnHeader({
  contributor,
  isCurrentUser,
}: {
  contributor: ContributorColumnHeaderContributor;
  isCurrentUser?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-h-12 items-center justify-end gap-2 px-3 py-2",
        isCurrentUser && "rounded-md bg-primary/5"
      )}
    >
      <span className="truncate text-sm font-medium">
        {displayName(contributor)}
      </span>
      <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
        {contributor.user?.imageUrl ? (
          <Image
            src={contributor.user.imageUrl}
            alt=""
            width={28}
            height={28}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-xs font-medium text-muted-foreground">
            {initials(contributor)}
          </span>
        )}
      </div>
    </div>
  );
}
