import { createTRPCRouter } from "@/server/api/trpc";

export const appRouter = createTRPCRouter({
  // Add your routers here
  // example: exampleRouter,
});

export type AppRouter = typeof appRouter;
