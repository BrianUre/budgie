import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/server/db";
import { createServices } from "@/server/services";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (userId) {
    try {
      const clerkUser = await clerkClient().users.getUser(userId);
      const email =
        clerkUser.emailAddresses.find(
          (e) => e.id === clerkUser.primaryEmailAddressId
        )?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress ?? "";
      const name =
        [clerkUser.firstName, clerkUser.lastName]
          .filter(Boolean)
          .join(" ")
          .trim() || null;
      const services = createServices(db);
      await services.user.upsert(userId, email, name, clerkUser.imageUrl);
    } catch {
      // Non-fatal: tRPC will sync on first protected call
    }
  }
  return <>{children}</>;
}
