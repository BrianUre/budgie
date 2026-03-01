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

export const adminRouter = createTRPCRouter({
  listForBudgie: protectedProcedure
    .input(z.object({ budgieId: z.string() }))
    .query(async ({ ctx, input }) => {
      await requireBudgieAdmin(ctx.services, input.budgieId, ctx.auth.userId);
      return ctx.services.admin.listAdminsForBudgie(input.budgieId);
    }),

  addAdmin: protectedProcedure
    .input(z.object({ budgieId: z.string(), userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await requireBudgieAdmin(ctx.services, input.budgieId, ctx.auth.userId);
      return ctx.services.admin.addAdmin(input.budgieId, input.userId);
    }),

  isAdmin: protectedProcedure
    .input(z.object({ budgieId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.services.admin.isAdmin(input.budgieId, ctx.auth.userId);
    }),
});
