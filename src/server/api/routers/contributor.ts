import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

async function requireBudgieAdmin(
  services: {
    contributor: { isAdmin: (budgieId: string, userId: string) => Promise<boolean> };
  },
  budgieId: string,
  userId: string
) {
  const isAdmin = await services.contributor.isAdmin(budgieId, userId);
  if (!isAdmin)
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Not an admin of this budgie",
    });
}

export const contributorRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ budgieId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.services.contributor.listForBudgie(input.budgieId);
    }),

  isAdmin: protectedProcedure
    .input(z.object({ budgieId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.services.contributor.isAdmin(input.budgieId, ctx.auth.userId);
    }),

  add: protectedProcedure
    .input(
      z
        .object({
          budgieId: z.string(),
          name: z.string().min(1).max(200).optional(),
          userId: z.string().optional(),
          isAdmin: z.boolean().optional(),
        })
        .refine((v) => v.name != null || v.userId != null, {
          message: "At least one of name or userId is required",
        })
    )
    .mutation(async ({ ctx, input }) => {
      await requireBudgieAdmin(ctx.services, input.budgieId, ctx.auth.userId);

      return ctx.services.contributor.add(input);
    }),

  remove: protectedProcedure
    .input(z.object({ budgieId: z.string(), contributorId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await requireBudgieAdmin(ctx.services, input.budgieId, ctx.auth.userId);

      return ctx.services.contributor.delete(input.contributorId);
    }),
});
