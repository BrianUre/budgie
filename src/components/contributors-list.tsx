"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AddContributorDialog } from "@/components/add-contributor-dialog";

export function ContributorsList({
  budgieId,
  contributors,
  isAdmin,
}: {
  budgieId: string;
  contributors: Array<{
    id: string;
    name: string | null;
    user?: { email: string } | null;
  }>;
  isAdmin: boolean;
}) {
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
      <CardContent>
        <ul className="space-y-1 text-sm">
          {contributors.map((contributor) => (
            <li key={contributor.id}>
              {contributor.user?.email ?? contributor.name}
            </li>
          ))}
          {contributors.length === 0 && (
            <li className="text-muted-foreground">No contributors yet.</li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
