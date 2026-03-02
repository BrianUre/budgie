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
import type { Contributors } from "@/server/services/contributor.service";
import type { ContributionsForMonth } from "@/server/services/contribution.service";

export function ContributionGrid({
  contributors,
  contributions,
  budgieId,
}: {
  contributors: Contributors;
  contributions: ContributionsForMonth;
  budgieId: string;
}) {
  const utils = api.useUtils();
  const { data: isAdmin = false } = api.admin.isAdmin.useQuery(
    { budgieId },
    { enabled: !!budgieId }
  );
  const setPercentageMutation = api.contribution.setPercentage.useMutation({
    onSuccess: () => {
      const monthId = contributions[0]?.cost?.monthId;
      if (monthId)
        void utils.contribution.listForMonth.invalidate({ monthId });
    },
  });

  const costColumns = useMemo(() => {
    const byId = new Map<
      string,
      { costId: string; name: string }
    >();
    for (const c of contributions) {
      if (c.costId && c.cost?.expense && !byId.has(c.costId))
        byId.set(c.costId, {
          costId: c.costId,
          name: c.cost.expense.name,
        });
    }
    return Array.from(byId.values());
  }, [contributions]);

  const contributionByKey = useMemo(() => {
    const map = new Map<string, (typeof contributions)[number]>();
    for (const c of contributions) {
      const key =
        c.contributorId != null
          ? `${c.costId}:contributor:${c.contributorId}`
          : c.userId != null
            ? `${c.costId}:user:${c.userId}`
            : null;
      if (key) map.set(key, c);
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
          {costColumns.map((col) => (
            <TableHead key={col.costId}>{col.name}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {contributors.map((contributor) => (
          <TableRow key={contributor.id}>
            <TableCell className="font-medium">{contributor.name}</TableCell>
            {costColumns.map((col) => {
              const contribution = getContribution(col.costId, contributor.id);
              const percentage = contribution
                ? Number(contribution.percentage)
                : 0;
              return (
                <TableCell key={col.costId}>
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
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        if (!Number.isNaN(v) && contribution)
                          handleChange(col.costId, contribution.id, v);
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
