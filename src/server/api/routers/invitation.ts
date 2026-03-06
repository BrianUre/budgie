import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";

async function createForBudgieHandler(opts: {
  ctx: { services: { budgie: { getById: (id: string) => Promise<{ name: string } | null> }; contributor: { isAdmin: (a: string, b: string) => Promise<boolean> }; invitation: { createForBudgie: (a: string, b: string, c: string, d?: string) => Promise<{ token: string }>; buildInvitationUrl: (t: string) => string }; user: { getById: (id: string) => Promise<{ name: string | null; email: string } | null> }; email: { sendBudgieInvitation: (to: string, p: { hostName: string; budgieName: string; invitationLink: string }) => Promise<void> } }; auth: { userId: string } };
  input: { budgieId: string; inviteeEmail: string; invitationMessage?: string };
}) {
  const { ctx, input } = opts;
  const budgie = await ctx.services.budgie.getById(input.budgieId);
  if (!budgie) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Budgie not found",
    });
  }
  const isAdmin = await ctx.services.contributor.isAdmin(
    input.budgieId,
    ctx.auth.userId
  );
  if (!isAdmin) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Not an admin of this budgie",
    });
  }
  const { token } = await ctx.services.invitation.createForBudgie(
    input.budgieId,
    input.inviteeEmail,
    ctx.auth.userId,
    input.invitationMessage
  );
  const invitationLink = ctx.services.invitation.buildInvitationUrl(token);
  const user = await ctx.services.user.getById(ctx.auth.userId);
  const hostName = user?.name ?? user?.email ?? "Someone";
  await ctx.services.email.sendBudgieInvitation(input.inviteeEmail, {
    hostName,
    budgieName: budgie.name,
    invitationLink,
  });
  return { sent: true };
}

export const invitationRouter = createTRPCRouter({
  getByToken: publicProcedure
    .input(z.object({ token: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const invitation = await ctx.services.invitation.getByToken(input.token);
      if (!invitation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invitation not found",
        });
      }
      return {
        id: invitation.id,
        email: invitation.email,
        budgieId: invitation.budgieId,
        budgieName: invitation.budgie.name,
        inviterName: invitation.invitedBy.name ?? invitation.invitedBy.email,
        expiresAt: invitation.expiresAt,
        invitationMessage: invitation.invitationMessage,
      };
    }),

  accept: protectedProcedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.services.invitation.accept(
          input.token,
          ctx.auth.userId
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to accept invitation";
        if (message.includes("not found") || message.includes("expired")) {
          throw new TRPCError({ code: "NOT_FOUND", message });
        }
        if (message.includes("already used")) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invitation has already been used",
          });
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message });
      }
    }),

  cancel: protectedProcedure
    .input(z.object({ invitationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await ctx.services.invitation.cancel(
          input.invitationId,
          ctx.auth.userId
        );
        return { cancelled: true };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to cancel invitation";
        if (message.includes("not found")) {
          throw new TRPCError({ code: "NOT_FOUND", message });
        }
        if (message.includes("Not authorized")) {
          throw new TRPCError({ code: "FORBIDDEN", message });
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message });
      }
    }),

  createForBudgie: protectedProcedure
    .input(
      z.object({
        budgieId: z.string(),
        inviteeEmail: z.string().email(),
        invitationMessage: z.string().optional(),
      })
    )
    .mutation(createForBudgieHandler),
});
