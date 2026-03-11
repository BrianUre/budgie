import { createTRPCReact } from "@trpc/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import { type AppRouter } from "@/server/api/root";

export const api = createTRPCReact<AppRouter>();

export type RouterOutputs = inferRouterOutputs<AppRouter>;
/** Normalized cost list from cost.listForMonth (amount and contribution.percentage as number). */
export type CostsForClient = RouterOutputs["cost"]["listForMonth"];
