import { createTRPCRouter } from "@/server/api/trpc";
import { budgieRouter } from "@/server/api/routers/budgie";
import { contributionRouter } from "@/server/api/routers/contribution";
import { contributorRouter } from "@/server/api/routers/contributor";
import { costRouter } from "@/server/api/routers/cost";
import { expenseRouter } from "@/server/api/routers/expense";
import { monthRouter } from "@/server/api/routers/month";

export const appRouter = createTRPCRouter({
  budgie: budgieRouter,
  month: monthRouter,
  expense: expenseRouter,
  cost: costRouter,
  contributor: contributorRouter,
  contribution: contributionRouter,
});

export type AppRouter = typeof appRouter;
