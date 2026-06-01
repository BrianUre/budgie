import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { currencySchema } from "@/types/currency";

export const budgieRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.services.budgie.listForUser(ctx.auth.userId);
  }),

  listForDashboard: protectedProcedure.query(async ({ ctx }) => {
    return ctx.services.budgie.listDashboardForUser(ctx.auth.userId);
  }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(200) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.services.budgie.create({ name: input.name }, ctx.auth.userId);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const budgie = await ctx.services.budgie.getById(input.id);
      if (!budgie) throw new TRPCError({ code: "NOT_FOUND", message: "Budgie not found" });
      return budgie;
    }),

  setCurrency: protectedProcedure
    .input(z.object({ id: z.string(), currency: currencySchema }))
    .mutation(async ({ ctx, input }) => {
      const budgie = await ctx.services.budgie.getById(input.id);
      if (!budgie) throw new TRPCError({ code: "NOT_FOUND", message: "Budgie not found" });
      const isAdmin = await ctx.services.contributor.isAdmin(input.id, ctx.auth.userId);
      if (!isAdmin)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not an admin of this budgie",
        });
      return ctx.services.budgie.update(input.id, { currency: input.currency });
    }),
});
