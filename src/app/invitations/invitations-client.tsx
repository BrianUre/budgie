"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { RedirectToSignIn } from "@clerk/nextjs";
import { api } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";

const EMAIL_MISMATCH_MESSAGE =
  "Oops! This invitation doesn't seem to be for you.";

export function InvitationsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const token = searchParams.get("token");
  const acceptStarted = useRef(false);

  const sessionEmail =
    user?.primaryEmailAddress?.emailAddress?.trim().toLowerCase() ?? "";

  const invitationQuery = api.invitation.getByToken.useQuery(
    { token: token ?? "" },
    { enabled: !!token && isLoaded && isSignedIn }
  );

  const invitationEmail =
    invitationQuery.data?.email?.trim().toLowerCase() ?? "";
  const emailsMatch =
    !!sessionEmail &&
    !!invitationEmail &&
    sessionEmail === invitationEmail;

  const acceptMutation = api.invitation.accept.useMutation({
    onSuccess: (data) => {
      router.replace(`/budgie/${data.budgieId}`);
    },
  });

  useEffect(() => {
    if (
      !token ||
      !isLoaded ||
      !isSignedIn ||
      !invitationQuery.isSuccess ||
      !emailsMatch ||
      acceptStarted.current ||
      acceptMutation.isPending ||
      acceptMutation.isSuccess
    )
      return;
    acceptStarted.current = true;
    acceptMutation.mutate({ token });
  }, [
    token,
    isLoaded,
    isSignedIn,
    invitationQuery.isSuccess,
    emailsMatch,
    acceptMutation.isPending,
    acceptMutation.isSuccess,
  ]);

  if (!token) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <p className="text-center text-muted-foreground">
          We&apos;re having trouble finding that invitation. Please double-check
          your URL.
        </p>
      </main>
    );
  }

  if (isLoaded && !isSignedIn) {
    const returnUrl = `/invitations?token=${encodeURIComponent(token)}`;
    return <RedirectToSignIn redirectUrl={returnUrl} />;
  }

  if (invitationQuery.isError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <p className="text-center text-muted-foreground">
          We&apos;re having trouble finding that invitation. Please double-check
          your URL.
        </p>
      </main>
    );
  }

  if (
    invitationQuery.isSuccess &&
    invitationQuery.data &&
    !emailsMatch
  ) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <p className="text-center text-muted-foreground">
          {EMAIL_MISMATCH_MESSAGE}
        </p>
      </main>
    );
  }

  const isEmailMismatchError =
    acceptMutation.isError &&
    acceptMutation.error.data?.code === "FORBIDDEN";

  if (acceptMutation.isError && isEmailMismatchError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <p className="text-center text-muted-foreground">
          {EMAIL_MISMATCH_MESSAGE}
        </p>
      </main>
    );
  }

  if (invitationQuery.isLoading || invitationQuery.isFetching) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <p className="text-muted-foreground">Loading invitation…</p>
      </main>
    );
  }

  if (acceptMutation.isPending) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <p className="text-muted-foreground">Accepting invitation…</p>
      </main>
    );
  }

  if (acceptMutation.isError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
        <p className="text-center text-destructive">
          {acceptMutation.error.message}
        </p>
        <Button
          variant="outline"
          onClick={() => acceptMutation.mutate({ token })}
        >
          Try again
        </Button>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <p className="text-muted-foreground">Redirecting…</p>
    </main>
  );
}
