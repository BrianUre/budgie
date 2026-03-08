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

export const destinationRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ budgieId: z.string() }))
    .query(async ({ ctx, input }) => {
      await requireBudgieAdmin(ctx.services, input.budgieId, ctx.auth.userId);
      return ctx.services.destination.listByBudgie(input.budgieId);
    }),

  create: protectedProcedure
    .input(
      z.object({
        budgieId: z.string(),
        name: z.string().min(1).max(200),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await requireBudgieAdmin(ctx.services, input.budgieId, ctx.auth.userId);
      return ctx.services.destination.create(input.budgieId, input.name);
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(200),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const destination = await ctx.services.destination.getById(input.id);
      if (!destination) throw new TRPCError({ code: "NOT_FOUND" });
      await requireBudgieAdmin(ctx.services, destination.budgieId, ctx.auth.userId);
      return ctx.services.destination.update(input.id, input.name);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const destination = await ctx.services.destination.getById(input.id);
      if (!destination) throw new TRPCError({ code: "NOT_FOUND" });
      await requireBudgieAdmin(ctx.services, destination.budgieId, ctx.auth.userId);
      await ctx.services.destination.delete(input.id);
      return { ok: true };
    }),
});
