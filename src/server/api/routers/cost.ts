import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { paymentStatusSchema } from "@/types/payment-status";

export const costRouter = createTRPCRouter({
  listForMonth: protectedProcedure
    .input(z.object({ monthId: z.string(), budgieId: z.string() }))
    .query(async ({ ctx, input }) => {
      const month = await ctx.services.month.getById(input.monthId);
      if (!month) throw new TRPCError({ code: "NOT_FOUND" });

      const costs = await ctx.services.cost.listForMonth(input.monthId);
      return costs.map((cost) => ({
        ...cost,
        amount: Number((cost as any).amount),
        contributions: (cost as any).contributions.map((c: any) => ({
          ...c,
          percentage: Number(c.percentage),
        })),
        paymentStatus: (cost as any).paymentStatus
          ? {
              ...(cost as any).paymentStatus,
            }
          : null,
      }));
    }),

  updateAmount: protectedProcedure
    .input(
      z.object({
        costId: z.string(),
        amount: z.number().min(0),
        budgieId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const isAdmin = await ctx.services.contributor.isAdmin(
        input.budgieId,
        ctx.auth.userId
      );
      if (!isAdmin) throw new TRPCError({ code: "FORBIDDEN" });

      return ctx.services.cost.updateAmount(input.costId, input.amount);
    }),

  setActive: protectedProcedure
    .input(
      z.object({
        costId: z.string(),
        isActive: z.boolean(),
        budgieId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const isAdmin = await ctx.services.contributor.isAdmin(
        input.budgieId,
        ctx.auth.userId
      );
      if (!isAdmin) throw new TRPCError({ code: "FORBIDDEN" });

      return ctx.services.cost.setActive(input.costId, input.isActive);
    }),

  updateDestination: protectedProcedure
    .input(
      z.object({
        costId: z.string(),
        destinationId: z.string().nullable(),
        budgieId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const isAdmin = await ctx.services.contributor.isAdmin(
        input.budgieId,
        ctx.auth.userId
      );
      if (!isAdmin) throw new TRPCError({ code: "FORBIDDEN" });

      const cost = await ctx.services.cost.getById(input.costId);
      if (!cost || cost.month.budgieId !== input.budgieId)
        throw new TRPCError({ code: "NOT_FOUND" });

      if (
        input.destinationId != null &&
        input.destinationId !== ""
      ) {
        const destination =
          await ctx.services.destination.getById(input.destinationId);
        if (!destination || destination.budgieId !== input.budgieId)
          throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.services.cost.updateDestination(
        input.costId,
        input.destinationId === "" ? null : input.destinationId
      );
    }),

  updatePaymentStatus: protectedProcedure
    .input(
      z.object({
        costId: z.string(),
        status: paymentStatusSchema,
        budgieId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const isAdmin = await ctx.services.contributor.isAdmin(
        input.budgieId,
        ctx.auth.userId
      );
      if (!isAdmin) throw new TRPCError({ code: "FORBIDDEN" });

      const cost = await ctx.services.cost.getById(input.costId);
      if (!cost || cost.month.budgieId !== input.budgieId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.services.cost.updatePaymentStatus(
        input.costId,
        input.status
      );
    }),

  createForMonth: protectedProcedure
    .input(
      z.object({
        monthId: z.string(),
        expenseId: z.string(),
        amount: z.number().min(0),
        budgieId: z.string(),
        destinationId: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const isAdmin = await ctx.services.contributor.isAdmin(
        input.budgieId,
        ctx.auth.userId
      );
      if (!isAdmin) throw new TRPCError({ code: "FORBIDDEN" });

      const month = await ctx.services.month.getById(input.monthId);
      if (!month || month.budgieId !== input.budgieId)
        throw new TRPCError({ code: "NOT_FOUND" });

      const expense = await ctx.services.expense.listForBudgie(input.budgieId);
      const expenseBelongsToBudgie = expense.some(
        (exp) => exp.id === input.expenseId
      );
      if (!expenseBelongsToBudgie)
        throw new TRPCError({ code: "NOT_FOUND" });

      const destinationId =
        input.destinationId != null && input.destinationId !== ""
          ? input.destinationId
          : undefined;

      if (destinationId) {
        const destination =
          await ctx.services.destination.getById(destinationId);
        if (!destination || destination.budgieId !== input.budgieId)
          throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.services.cost.createForMonth(
        input.monthId,
        input.expenseId,
        input.amount,
        input.budgieId,
        destinationId
      );
    }),
});