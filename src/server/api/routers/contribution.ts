import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

const contributionItemSchema = z.object({
  contributorId: z.string(),
  percentage: z.number().min(0).max(100),
});

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

  setPercentages: protectedProcedure
    .input(
      z.object({
        costId: z.string(),
        contributions: z.array(contributionItemSchema).refine(
          (arr) => {
            const sum = arr.reduce((s, c) => s + c.percentage, 0);
            return Math.abs(sum - 100) < 0.01;
          },
          { message: "Percentages must sum to 100" }
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const cost = await ctx.services.cost.getById(input.costId);
      if (!cost) throw new TRPCError({ code: "NOT_FOUND" });
      const isAdmin = await ctx.services.contributor.isAdmin(cost.month.budgieId, ctx.auth.userId);
      if (!isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
      return ctx.services.contribution.setPercentages(input.costId, input.contributions);
    }),

  setPercentage: protectedProcedure
    .input(
      z.object({
        costId: z.string(),
        contributionId: z.string(),
        percentage: z.number().min(0).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const cost = await ctx.services.cost.getById(input.costId);
      if (!cost) throw new TRPCError({ code: "NOT_FOUND" });
      const isAdmin = await ctx.services.contributor.isAdmin(cost.month.budgieId, ctx.auth.userId);
      if (!isAdmin) throw new TRPCError({ code: "FORBIDDEN" });
      return ctx.services.contribution.setPercentage(
        input.costId,
        input.contributionId,
        input.percentage
      );
    }),
});
