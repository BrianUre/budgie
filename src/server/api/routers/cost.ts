import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const costRouter = createTRPCRouter({
  listForMonth: protectedProcedure
    .input(z.object({ monthId: z.string() }))
    .query(async ({ ctx, input }) => {
      const month = await ctx.services.month.getById(input.monthId);
      if (!month) throw new TRPCError({ code: "NOT_FOUND" });
      const isAdmin = await ctx.services.admin.isAdmin(month.budgieId, ctx.auth.userId);
      if (!isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
      return ctx.services.cost.listForMonth(input.monthId);
    }),

  updateAmount: protectedProcedure
    .input(z.object({ costId: z.string(), amount: z.number().min(0) }))
    .mutation(async ({ ctx, input }) => {
      const cost = await ctx.services.cost.getById(input.costId);
      if (!cost) throw new TRPCError({ code: "NOT_FOUND" });
      const isAdmin = await ctx.services.admin.isAdmin(cost.month.budgieId, ctx.auth.userId);
      if (!isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
      return ctx.services.cost.updateAmount(input.costId, input.amount);
    }),
});
