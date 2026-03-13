import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { inferRouterOutputs } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { destinationTypeSchema } from "@/types/destination";

type ContributorServices = {
  contributor: {
    isAdmin: (budgieId: string, userId: string) => Promise<boolean>;
    isContributor: (budgieId: string, userId: string) => Promise<boolean>;
  };
};

async function requireBudgieAdmin(
  services: ContributorServices,
  budgieId: string,
  userId: string
) {
  const isAdmin = await services.contributor.isAdmin(budgieId, userId);
  if (!isAdmin) throw new TRPCError({ code: "FORBIDDEN", message: "Not an admin of this budgie" });
}

async function requireBudgieContributor(
  services: ContributorServices,
  budgieId: string,
  userId: string
) {
  const isContributor = await services.contributor.isContributor(budgieId, userId);
  if (!isContributor)
    throw new TRPCError({ code: "FORBIDDEN", message: "Not a contributor of this budgie" });
}

export const destinationRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ budgieId: z.string() }))
    .query(async ({ ctx, input }) => {
      await requireBudgieContributor(ctx.services, input.budgieId, ctx.auth.userId);
      return ctx.services.destination.listByBudgie(input.budgieId);
    }),

  create: protectedProcedure
    .input(
      z.object({
        budgieId: z.string(),
        name: z.string().min(1).max(200),
        recipientName: z.string().min(1).max(200),
        type: destinationTypeSchema,
        iban: z.string().max(50).optional().nullable(),
        swift: z.string().max(50).optional().nullable(),
        phone: z.string().max(50).optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await requireBudgieAdmin(ctx.services, input.budgieId, ctx.auth.userId);
      return ctx.services.destination.create(
        input.budgieId,
        input.name,
        input.recipientName,
        input.type,
        {
          iban: input.iban,
          swift: input.swift,
          phone: input.phone,
        }
      );
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(200).optional(),
        recipientName: z.string().min(1).max(200).optional(),
        type: destinationTypeSchema.optional(),
        iban: z.string().max(50).optional().nullable(),
        swift: z.string().max(50).optional().nullable(),
        phone: z.string().max(50).optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const destination = await ctx.services.destination.getById(input.id);
      if (!destination) throw new TRPCError({ code: "NOT_FOUND" });
      await requireBudgieAdmin(ctx.services, destination.budgieId, ctx.auth.userId);
      const { id, ...data } = input;
      return ctx.services.destination.update(id, data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const destination = await ctx.services.destination.getById(input.id);
      if (!destination) throw new TRPCError({ code: "NOT_FOUND" });
      await requireBudgieAdmin(ctx.services, destination.budgieId, ctx.auth.userId);
      const costCount = await ctx.services.destination.countCostsByDestinationId(input.id);
      if (costCount > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "This destination is in use by one or more costs and cannot be deleted.",
        });
      }
      await ctx.services.destination.delete(input.id);
      return { ok: true };
    }),
});

export type DestinationListOutput = inferRouterOutputs<typeof destinationRouter>["list"];

export type DestinationListItem = DestinationListOutput[number];