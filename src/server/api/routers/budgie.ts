import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { generateInvitationUrl } from "@/server/utils/invitation-url";

export const budgieRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.services.budgie.listForUser(ctx.auth.userId);
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
      const isAdmin = await ctx.services.contributor.isAdmin(budgie.id, ctx.auth.userId);
      if (!isAdmin) throw new TRPCError({ code: "FORBIDDEN", message: "Not an admin of this budgie" });
      return budgie;
    }),

  inviteContributor: protectedProcedure
    .input(
      z.object({
        budgieId: z.string(),
        inviteeEmail: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const budgie = await ctx.services.budgie.getById(input.budgieId);
      if (!budgie)
        throw new TRPCError({ code: "NOT_FOUND", message: "Budgie not found" });
      const isAdmin = await ctx.services.contributor.isAdmin(
        input.budgieId,
        ctx.auth.userId
      );
      if (!isAdmin)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not an admin of this budgie",
        });
      const user = await ctx.services.user.getById(ctx.auth.userId);
      const hostName = user?.name ?? user?.email ?? "Someone";
      const invitationLink = generateInvitationUrl(input.budgieId, input.inviteeEmail);
      await ctx.services.email.sendBudgieInvitation(input.inviteeEmail, {
        hostName,
        budgieName: budgie.name,
        invitationLink,
      });
      return { sent: true };
    }),
});
