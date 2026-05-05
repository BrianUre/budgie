import { createTRPCRouter } from "@/server/api/trpc";
import { budgieRouter } from "@/server/api/routers/budgie";
import { categoryRouter } from "@/server/api/routers/category";
import { contributionRouter } from "@/server/api/routers/contribution";
import { contributorRouter } from "@/server/api/routers/contributor";
import { costRouter } from "@/server/api/routers/cost";
import { destinationRouter } from "@/server/api/routers/destination";
import { expenseRouter } from "@/server/api/routers/expense";
import { invitationRouter } from "@/server/api/routers/invitation";
import { monthRouter } from "@/server/api/routers/month";

export const appRouter = createTRPCRouter({
  budgie: budgieRouter,
  month: monthRouter,
  expense: expenseRouter,
  cost: costRouter,
  contributor: contributorRouter,
  contribution: contributionRouter,
  destination: destinationRouter,
  category: categoryRouter,
  invitation: invitationRouter,
});

export type AppRouter = typeof appRouter;
