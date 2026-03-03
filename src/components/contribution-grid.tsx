"use client";

import { useMemo } from "react";
import { api } from "@/lib/trpc/client";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function ContributionGrid({
  budgieId,
  monthId,
}: {
  budgieId: string;
  monthId: string;
}) {
  const utils = api.useUtils();
  const { data: contributors = [] } = api.contributor.list.useQuery(
    { budgieId },
    { enabled: !!budgieId }
  );
  const { data: contributions = [] } = api.contribution.listForMonth.useQuery(
    { monthId },
    { enabled: !!monthId }
  );
  const { data: isAdmin = false } = api.admin.isAdmin.useQuery(
    { budgieId },
    { enabled: !!budgieId }
  );
  const setPercentageMutation = api.contribution.setPercentage.useMutation({
    onSuccess: () => {
      void utils.contribution.listForMonth.invalidate({ monthId });
    },
  });

  const costColumns = useMemo(() => {
    const byId = new Map<string, { costId: string; name: string }>();
    for (const contribution of contributions) {
      if (
        contribution.costId &&
        contribution.cost?.expense &&
        !byId.has(contribution.costId)
      ) {
        byId.set(contribution.costId, {
          costId: contribution.costId,
          name: contribution.cost.expense.name,
        });
      }
    }
    return Array.from(byId.values());
  }, [contributions]);

  const contributionByKey = useMemo(() => {
    const map = new Map<string, (typeof contributions)[number]>();
    for (const contribution of contributions) {
      map.set(
        `${contribution.costId}:contributor:${contribution.contributorId}`,
        contribution
      );
    }
    return map;
  }, [contributions]);

  const getContribution = (costId: string, contributorId: string) =>
    contributionByKey.get(`${costId}:contributor:${contributorId}`);

  const handleChange = (
    costId: string,
    contributionId: string,
    percentage: number
  ) => {
    void setPercentageMutation.mutateAsync({
      costId,
      contributionId,
      percentage,
    });
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Contributor</TableHead>
          {costColumns.map((column) => (
            <TableHead key={column.costId}>{column.name}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {contributors.map((contributor) => (
          <TableRow key={contributor.id}>
            <TableCell className="font-medium">
              {contributor.user?.email ?? contributor.name}
            </TableCell>
            {costColumns.map((column) => {
              const contribution = getContribution(
                column.costId,
                contributor.id
              );
              const percentage = contribution
                ? Number(contribution.percentage)
                : 0;
              return (
                <TableCell key={column.costId}>
                  {isAdmin ? (
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      className="h-8 w-16"
                      value={percentage}
                      disabled={
                        setPercentageMutation.isPending || !contribution
                      }
                      onChange={(event) => {
                        const value = parseFloat(event.target.value);
                        if (!Number.isNaN(value) && contribution) {
                          handleChange(
                            column.costId,
                            contribution.id,
                            value
                          );
                        }
                      }}
                    />
                  ) : (
                    `${percentage}%`
                  )}
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
