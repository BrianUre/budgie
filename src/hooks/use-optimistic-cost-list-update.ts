"use client";

import { api } from "@/lib/trpc/client";
import type { CostListForMonth } from "@/server/api/routers/cost";

/**
 * Returns helpers for performing cache-level optimistic updates against the
 * `cost.listForMonth` query for a given `(monthId, budgieId)` pair. Use from a
 * mutation's `onMutate`/`onError` callbacks to keep the UI responsive without
 * waiting on a refetch.
 *
 * Pattern:
 * ```
 * const optimistic = useOptimisticCostListUpdate({ monthId, budgieId });
 * const mutation = api.X.Y.useMutation({
 *   onMutate: (input) => optimistic.apply((rows) => updatedRows),
 *   onError: (_err, _vars, ctx) => optimistic.rollback(ctx?.snapshot),
 * });
 * ```
 */
export function useOptimisticCostListUpdate(args: {
  monthId: string;
  budgieId: string;
}) {
  const utils = api.useUtils();
  return {
    /**
     * Cancels any in-flight `cost.listForMonth` fetch (so a late response
     * cannot overwrite the optimistic write), snapshots the current cache,
     * then writes the result of `updater(currentRows)` into the cache.
     * Returns the snapshot for `rollback` to restore on error.
     */
    apply: async (
      updater: (rows: CostListForMonth) => CostListForMonth
    ): Promise<{ snapshot: CostListForMonth | undefined }> => {
      await utils.cost.listForMonth.cancel(args);
      const snapshot = utils.cost.listForMonth.getData(args);
      utils.cost.listForMonth.setData(args, (prev) =>
        prev ? updater(prev) : prev
      );
      return { snapshot };
    },
    /**
     * Restores the cache to the snapshot returned by `apply`. No-op when
     * `snapshot` is undefined (e.g. the optimistic write was skipped).
     */
    rollback: (snapshot: CostListForMonth | undefined) => {
      if (snapshot) utils.cost.listForMonth.setData(args, snapshot);
    },
  };
}
