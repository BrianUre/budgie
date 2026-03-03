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

export const adminRouter = createTRPCRouter({
  listForBudgie: protectedProcedure
    .input(z.object({ budgieId: z.string() }))
    .query(async ({ ctx, input }) => {
      await requireBudgieAdmin(ctx.services, input.budgieId, ctx.auth.userId);
      const contributors = await ctx.services.contributor.listAdminsForBudgie(input.budgieId);
      return contributors
        .filter((c) => c.user != null)
        .map((c) => ({ user: c.user! }));
    }),

  addAdmin: protectedProcedure
    .input(z.object({ budgieId: z.string(), userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await requireBudgieAdmin(ctx.services, input.budgieId, ctx.auth.userId);
      return ctx.services.contributor.add({
        budgieId: input.budgieId,
        userId: input.userId,
        isAdmin: true,
      });
    }),

  isAdmin: protectedProcedure
    .input(z.object({ budgieId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.services.contributor.isAdmin(input.budgieId, ctx.auth.userId);
    }),
});
