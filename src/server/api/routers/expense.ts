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

export const expenseRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ budgieId: z.string() }))
    .query(async ({ ctx, input }) => {
      await requireBudgieAdmin(ctx.services, input.budgieId, ctx.auth.userId);
      return ctx.services.expense.listForBudgie(input.budgieId);
    }),

  create: protectedProcedure
    .input(
      z.object({
        budgieId: z.string(),
        monthId: z.string(),
        name: z.string().min(1).max(200),
        initialAmount: z.number().min(0),
        destinationId: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await requireBudgieAdmin(ctx.services, input.budgieId, ctx.auth.userId);
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
      return ctx.services.expense.create(
        {
          budgieId: input.budgieId,
          name: input.name,
          initialAmount: input.initialAmount,
          destinationId: destinationId ?? null,
        },
        input.monthId
      );
    }),

  archive: protectedProcedure
    .input(
      z.object({
        expenseId: z.string(),
        budgieId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await requireBudgieAdmin(ctx.services, input.budgieId, ctx.auth.userId);
      await ctx.services.expense.archive(input.expenseId);
      return { ok: true };
    }),
});
