"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";

const TABS = [
  "Months",
  "Expenses",
  "Totals",
  "Destinations",
  "Contributors",
] as const;

export function BudgieSidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={false}>
      <Sidebar side="right">
        <SidebarContent>
          <SidebarMenu>
            {TABS.map((label) => (
              <SidebarMenuItem key={label}>
                <SidebarMenuButton type="button">
                  {label}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
