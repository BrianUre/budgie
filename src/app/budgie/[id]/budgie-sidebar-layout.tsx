"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const TAB_ROUTES = [
  { segment: "expenses", label: "Expenses" },
  { segment: "payments", label: "Payments" },
  { segment: "destinations", label: "Destinations" },
  { segment: "collaborators", label: "Collaborators" },
] as const;

export function BudgieSidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const id = params.id as string;
  const basePath = `/budgie/${id}`;

  return (
    <SidebarProvider defaultOpen={false}>
      <Sidebar side="right" className="md:hidden">
        <SidebarContent>
          <SidebarMenu>
            {TAB_ROUTES.map(({ segment, label }) => {
              const href = `${basePath}/${segment}`;
              const isActive = pathname === href;
              return (
                <SidebarMenuItem key={segment}>
                  <SidebarMenuButton asChild isActive={isActive}>
                    <Link href={href}>{label}</Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
