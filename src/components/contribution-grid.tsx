"use client";

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
  costs,
  contributorRows,
  contributionsByCost,
  isAdmin,
  onSetPercentages,
  isPending,
}: {
  costs: { id: string; expenseId: string; expense: { name: string } }[];
  contributorRows: { id: string; label: string; type: "user" | "contributor" }[];
  contributionsByCost: Map<
    string,
    {
      id: string;
      costId: string;
      userId: string | null;
      contributorId: string | null;
      percentage: { toString(): string };
    }[]
  >;
  isAdmin: boolean;
  onSetPercentages: (
    costId: string,
    contributions: { userId?: string; contributorId?: string; percentage: number }[]
  ) => Promise<unknown>;
  isPending: boolean;
}) {
  const getPct = (costId: string, contributorId: string, type: "user" | "contributor") => {
    const list = contributionsByCost.get(costId) ?? [];
    const c = list.find(
      (x) =>
        (type === "user" && x.userId === contributorId) ||
        (type === "contributor" && x.contributorId === contributorId)
    );
    return c ? Number(c.percentage) : 0;
  };

  const handleChange = async (
    costId: string,
    contributorId: string,
    type: "user" | "contributor",
    newPct: number
  ) => {
    const othersSum = contributorRows
      .filter((r) => r.id !== contributorId)
      .reduce((s, r) => s + getPct(costId, r.id, r.type), 0);
    const scale = othersSum > 0 ? (100 - newPct) / othersSum : 0;
    const contributions: { userId?: string; contributorId?: string; percentage: number }[] =
      contributorRows.map((r) => {
        if (r.id === contributorId) {
          return {
            ...(type === "user" ? { userId: r.id } : { contributorId: r.id }),
            percentage: newPct,
          };
        }
        const pct = getPct(costId, r.id, r.type);
        return {
          ...(r.type === "user" ? { userId: r.id } : { contributorId: r.id }),
          percentage: othersSum > 0 ? scale * pct : 0,
        };
      });
    await onSetPercentages(costId, contributions);
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Contributor</TableHead>
          {costs.map((c) => (
            <TableHead key={c.id}>{c.expense.name}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {contributorRows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="font-medium">{row.label}</TableCell>
            {costs.map((cost) => {
              const pct = getPct(cost.id, row.id, row.type);
              return (
                <TableCell key={cost.id}>
                  {isAdmin ? (
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      className="h-8 w-16"
                      value={pct}
                      disabled={isPending}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        if (!Number.isNaN(v))
                          void handleChange(cost.id, row.id, row.type, v);
                      }}
                    />
                  ) : (
                    `${pct}%`
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
