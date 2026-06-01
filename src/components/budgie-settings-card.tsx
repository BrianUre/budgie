"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/trpc/client";
import { CURRENCY_OPTIONS, currencySchema, type Currency } from "@/types/currency";

export function BudgieSettingsCard({
  budgieId,
  isAdmin,
  currency,
}: {
  budgieId: string;
  isAdmin: boolean;
  currency: Currency;
}) {
  const utils = api.useUtils();
  const setCurrencyMutation = api.budgie.setCurrency.useMutation({
    onSuccess: () => {
      void utils.budgie.getById.invalidate({ id: budgieId });
    },
  });

  const handleCurrencyChange = (value: string) => {
    const parsed = currencySchema.safeParse(value);
    if (!parsed.success) return;
    setCurrencyMutation.mutate({ id: budgieId, currency: parsed.data });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>
          Configure preferences for this budgie.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex max-w-sm flex-col gap-2">
          <Label htmlFor="currency">Currency</Label>
          <Select
            value={currency}
            onValueChange={handleCurrencyChange}
            disabled={!isAdmin || setCurrencyMutation.isPending}
          >
            <SelectTrigger id="currency">
              <SelectValue placeholder="Select a currency" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            The symbol used to display all amounts in this budgie.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
