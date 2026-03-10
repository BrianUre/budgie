import { initTRPC, TRPCError } from "@trpc/server";
import { type FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { clerkClient, getAuth } from "@clerk/nextjs/server";
import { db } from "@/server/db";
import { createServices } from "@/server/services";
import superjson from "superjson";
import { ZodError } from "zod";

export const createTRPCContext = async (opts: FetchCreateContextFnOptions) => {
  const auth = await getAuth(opts.req as Parameters<typeof getAuth>[0]);
  const services = createServices(db);

  return {
    db,
    auth,
    services,
  };
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

const isAuthenticated = t.middleware(async ({ ctx, next }) => {
  if (!ctx.auth.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  const userId = ctx.auth.userId;
  const clerkUser = await clerkClient().users.getUser(userId);
  const email =
    clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() ||
    null;
  await ctx.services.user.upsert(
    userId,
    email,
    name,
    clerkUser.imageUrl
  );

  return next({
    ctx: {
      auth: {
        userId,
      },
    },
  });
});

export const protectedProcedure = t.procedure.use(isAuthenticated);
