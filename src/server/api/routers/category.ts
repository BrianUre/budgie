import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { inferRouterOutputs } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { categoryColorSchema } from "@/types/category";

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
  if (!isAdmin)
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Not an admin of this budgie",
    });
}

async function requireBudgieContributor(
  services: ContributorServices,
  budgieId: string,
  userId: string
) {
  const isContributor = await services.contributor.isContributor(
    budgieId,
    userId
  );
  if (!isContributor)
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Not a contributor of this budgie",
    });
}

export const categoryRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ budgieId: z.string() }))
    .query(async ({ ctx, input }) => {
      await requireBudgieContributor(
        ctx.services,
        input.budgieId,
        ctx.auth.userId
      );
      return ctx.services.category.listByBudgie(input.budgieId);
    }),

  create: protectedProcedure
    .input(
      z.object({
        budgieId: z.string(),
        name: z.string().min(1).max(200),
        color: categoryColorSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      await requireBudgieAdmin(ctx.services, input.budgieId, ctx.auth.userId);
      return ctx.services.category.create(
        input.budgieId,
        input.name,
        input.color
      );
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(200).optional(),
        color: categoryColorSchema.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const category = await ctx.services.category.getById(input.id);
      if (!category) throw new TRPCError({ code: "NOT_FOUND" });
      await requireBudgieAdmin(
        ctx.services,
        category.budgieId,
        ctx.auth.userId
      );
      const { id, ...data } = input;
      return ctx.services.category.update(id, data);
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const category = await ctx.services.category.getById(input.id);
      if (!category) throw new TRPCError({ code: "NOT_FOUND" });
      await requireBudgieAdmin(
        ctx.services,
        category.budgieId,
        ctx.auth.userId
      );
      const costCount = await ctx.services.category.countCostsByCategoryId(
        input.id
      );
      if (costCount > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "This category is in use by one or more costs and cannot be deleted.",
        });
      }
      await ctx.services.category.delete(input.id);
      return { ok: true };
    }),
});

export type CategoryListOutput = inferRouterOutputs<
  typeof categoryRouter
>["list"];

export type CategoryListItem = CategoryListOutput[number];
