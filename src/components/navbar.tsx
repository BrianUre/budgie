"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams, useSelectedLayoutSegments } from "next/navigation";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV_ROUTES = [
  { segment: "expenses", label: "Expenses" },
  { segment: "payments", label: "Payments" },
  { segment: "destinations", label: "Destinations" },
  { segment: "categories", label: "Categories" },
  { segment: "collaborators", label: "Contributors" },
] as const;

/** App-wide navigation bar. Displays the Budgie logo linking to the home page. */
export function Navbar() {
  const params = useParams();
  const segments = useSelectedLayoutSegments();
  // segments = ["budgie", "<id>", "<segment>"] on budgie detail pages
  const budgieId = segments[0] === "budgie" && params.id ? (params.id as string) : null;
  const currentSegment = segments[2] ?? "expenses";
  const basePath = budgieId ? `/budgie/${budgieId}` : null;

  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <nav className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-4 sm:px-8">
        <Link href="/">
          <Image src="/budgie-logo.svg" alt="Budgie" width={32} height={32} />
        </Link>

        {budgieId && (
          <div className="ml-auto hidden md:flex items-center gap-1">
            {NAV_ROUTES.map(({ segment, label }) => (
              <Link
                key={segment}
                href={`/budgie/${budgieId}/${segment}`}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                  currentSegment === segment
                    ? "text-foreground bg-muted"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {label}
              </Link>
            ))}
          </div>
        )}

        {budgieId && (
          <div className="ml-auto md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSheetOpen(true)}
            >
              <Menu className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </div>
        )}
      </div>

      {budgieId && basePath && (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="right">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <nav className="flex flex-col gap-1 pt-4">
              {NAV_ROUTES.map(({ segment, label }) => (
                <Link
                  key={segment}
                  href={`${basePath}/${segment}`}
                  onClick={() => setSheetOpen(false)}
                  className={cn(
                    "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    currentSegment === segment
                      ? "text-foreground bg-muted"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      )}
    </nav>
  );
}
