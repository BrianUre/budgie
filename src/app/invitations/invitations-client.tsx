"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { RedirectToSignIn } from "@clerk/nextjs";
import { api } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";

export function InvitationsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const token = searchParams.get("token");
  const acceptStarted = useRef(false);

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
      acceptStarted.current ||
      acceptMutation.isPending ||
      acceptMutation.isSuccess
    )
      return;
    acceptStarted.current = true;
    acceptMutation.mutate({ token });
  }, [token, isLoaded, isSignedIn]);

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
