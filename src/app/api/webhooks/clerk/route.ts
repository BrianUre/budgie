import { Webhook } from "svix";
import { db } from "@/server/db";
import { createServices } from "@/server/services";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";

export async function POST(request: Request) {
  const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!secret) {
    console.error("Clerk webhook: CLERK_WEBHOOK_SIGNING_SECRET is not set");
    return new Response("Webhook secret not configured", { status: 500 });
  }

  let evt: WebhookEvent;
  try {
    const body = await request.text();
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    const webhook = new Webhook(secret);
    evt = webhook.verify(body, headers) as WebhookEvent;
  } catch (err) {
    console.error("Clerk webhook verification failed:", err);
    return new Response("Error verifying webhook", { status: 400 });
  }

  const services = createServices(db);

  try {
    if (evt.type === "user.created" || evt.type === "user.updated") {
      const data = evt.data as {
        id: string;
        primary_email_address_id: string | null;
        email_addresses: { id: string; email_address: string }[];
        first_name: string | null;
        last_name: string | null;
      };
      const email =
        data.email_addresses?.find(
          (e) => e.id === data.primary_email_address_id
        )?.email_address ??
        data.email_addresses?.[0]?.email_address ??
        "";
      const name =
        [data.first_name, data.last_name].filter(Boolean).join(" ").trim() ||
        null;
      await services.user.upsert(data.id, email, name);
      return new Response("OK", { status: 200 });
    }

    if (evt.type === "user.deleted") {
      const data = evt.data as { id?: string; deleted?: boolean };
      const userId = data.id;
      if (!userId) {
        console.error("Clerk webhook user.deleted: missing id in payload", data);
        return new Response("Missing user id", { status: 400 });
      }
      try {
        await services.user.delete(userId);
      } catch (deleteErr) {
        if (
          deleteErr instanceof Prisma.PrismaClientKnownRequestError &&
          deleteErr.code === "P2025"
        ) {
          return new Response("OK", { status: 200 });
        }
        throw deleteErr;
      }
      return new Response("OK", { status: 200 });
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error(
      "Clerk webhook processing failed:",
      evt.type,
      (evt.data as { id?: string })?.id,
      err
    );
    return new Response("Processing failed", { status: 500 });
  }
}
