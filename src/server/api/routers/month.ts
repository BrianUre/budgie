import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

async function requireBudgieAdmin(
  services: { contributor: { isAdmin: (budgieId: string, userId: string) => Promise<boolean> } },
  budgieId: string,
  userId: string
) {
  const isAdmin = await services.contributor.isAdmin(budgieId, userId);
  if (!isAdmin) throw new TRPCError({ code: "FORBIDDEN", message: "Not an admin of this budgie" });
}

export const monthRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ budgieId: z.string() }))
    .query(async ({ ctx, input }) => {
      await requireBudgieAdmin(ctx.services, input.budgieId, ctx.auth.userId);
      return ctx.services.month.listForBudgie(input.budgieId);
    }),

  getOrCreate: protectedProcedure
    .input(z.object({ budgieId: z.string(), year: z.number(), month: z.number().min(1).max(12) }))
    .mutation(async ({ ctx, input }) => {
      await requireBudgieAdmin(ctx.services, input.budgieId, ctx.auth.userId);
      return ctx.services.month.getOrCreateForBudgie(
        input.budgieId,
        input.year,
        input.month
      );
    }),
});
