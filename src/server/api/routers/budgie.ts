import { clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const budgieRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.services.budgie.listForUser(ctx.auth.userId);
  }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(200) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId;
      const clerkUser = await clerkClient().users.getUser(userId);
      const email =
        clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
          ?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress ?? "";
      await ctx.services.user.upsert(userId, email);
      return ctx.services.budgie.create({ name: input.name }, userId);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const budgie = await ctx.services.budgie.getById(input.id);
      if (!budgie) throw new TRPCError({ code: "NOT_FOUND", message: "Budgie not found" });
      const isAdmin = await ctx.services.admin.isAdmin(budgie.id, ctx.auth.userId);
      if (!isAdmin) throw new TRPCError({ code: "FORBIDDEN", message: "Not an admin of this budgie" });
      return budgie;
    }),
});
