import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

async function requireBudgieAdmin(
  services: { admin: { isAdmin: (budgieId: string, userId: string) => Promise<boolean> } },
  budgieId: string,
  userId: string
) {
  const isAdmin = await services.admin.isAdmin(budgieId, userId);
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
        name: z.string().min(1).max(200),
        initialAmount: z.number().min(0),
        year: z.number().optional(),
        month: z.number().min(1).max(12).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await requireBudgieAdmin(ctx.services, input.budgieId, ctx.auth.userId);
      const now = new Date();
      const year = input.year ?? now.getFullYear();
      const month = input.month ?? now.getMonth() + 1;
      const monthRow = await ctx.services.month.getOrCreateForBudgie(
        input.budgieId,
        year,
        month
      );
      return ctx.services.expense.create(
        {
          budgieId: input.budgieId,
          name: input.name,
          initialAmount: input.initialAmount,
        },
        monthRow.id
      );
    }),
});
