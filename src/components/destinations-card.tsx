"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DestinationManagementDialog } from "@/components/destination-management-dialog";

type Destination = {
  id: string;
  name: string | null;
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
          <DestinationManagementDialog budgieId={budgieId} />
        )}
      </CardHeader>
      <CardContent>
        {destinations.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No destinations yet.
            {isAdmin && " Open Manage destinations to add one."}
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {destinations.map((d) => (
              <li
                key={d.id}
                className="rounded-md border bg-muted/50 px-3 py-1.5 text-sm"
              >
                {d.name}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
