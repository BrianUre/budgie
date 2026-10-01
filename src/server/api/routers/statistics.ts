import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { inferRouterOutputs } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const statisticsRouter = createTRPCRouter({
  monthlyBreakdown: protectedProcedure
    .input(
      z.object({
        budgieId: z.string(),
        monthCount: z.number().int().min(1).max(120).nullable(),
      })
    )
    .query(async ({ ctx, input }) => {
      const isContributor = await ctx.services.contributor.isContributor(
        input.budgieId,
        ctx.auth.userId
      );
      if (!isContributor) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not a contributor of this budgie",
        });
      }

      return ctx.services.statistics.monthlyBreakdown(
        input.budgieId,
        input.monthCount
      );
    }),
});

export type MonthlyBreakdown = inferRouterOutputs<
  typeof statisticsRouter
>["monthlyBreakdown"];

export type MonthlyBreakdownPoint = MonthlyBreakdown[number];
