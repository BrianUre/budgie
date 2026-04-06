import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const contributionRouter = createTRPCRouter({
  listForCost: protectedProcedure
    .input(z.object({ costId: z.string() }))
    .query(async ({ ctx, input }) => {
      const cost = await ctx.services.cost.getById(input.costId);
      if (!cost) throw new TRPCError({ code: "NOT_FOUND" });
      const isAdmin = await ctx.services.contributor.isAdmin(cost.month.budgieId, ctx.auth.userId);
      if (!isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
      return ctx.services.contribution.listForCost(input.costId);
    }),

  listForMonth: protectedProcedure
    .input(z.object({ monthId: z.string() }))
    .query(async ({ ctx, input }) => {
      const month = await ctx.services.month.getById(input.monthId);
      if (!month) throw new TRPCError({ code: "NOT_FOUND" });
      const isAdmin = await ctx.services.contributor.isAdmin(month.budgieId, ctx.auth.userId);
      if (!isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
      return ctx.services.contribution.listForMonth(input.monthId);
    }),

  setAmount: protectedProcedure
    .input(
      z.object({
        costId: z.string(),
        contributionId: z.string(),
        amount: z.number().min(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const cost = await ctx.services.cost.getById(input.costId);
      if (!cost) throw new TRPCError({ code: "NOT_FOUND" });
      const isAdmin = await ctx.services.contributor.isAdmin(cost.month.budgieId, ctx.auth.userId);
      if (!isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
      return ctx.services.contribution.setAmount(input.contributionId, input.amount);
    }),

  upsertAmount: protectedProcedure
    .input(
      z.object({
        costId: z.string(),
        contributorId: z.string(),
        amount: z.number().min(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const cost = await ctx.services.cost.getById(input.costId);
      if (!cost) throw new TRPCError({ code: "NOT_FOUND" });
      const isAdmin = await ctx.services.contributor.isAdmin(cost.month.budgieId, ctx.auth.userId);
      if (!isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
      return ctx.services.contribution.upsertAmount(input.costId, input.contributorId, input.amount);
    }),
});
