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
      const date = new Date(input.year, input.month - 1, 1);
      return ctx.services.month.getOrCreateForBudgie(input.budgieId, date);
    }),

  createNext: protectedProcedure
    .input(z.object({ budgieId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await requireBudgieAdmin(ctx.services, input.budgieId, ctx.auth.userId);
      return ctx.services.month.createNextForBudgie(input.budgieId);
    }),

  delete: protectedProcedure
    .input(z.object({ monthId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const month = await ctx.services.month.getById(input.monthId);
      if (!month)
        throw new TRPCError({ code: "NOT_FOUND", message: "Month not found" });
      await requireBudgieAdmin(ctx.services, month.budgieId, ctx.auth.userId);
      await ctx.services.month.delete(input.monthId);
      return { ok: true };
    }),
});
