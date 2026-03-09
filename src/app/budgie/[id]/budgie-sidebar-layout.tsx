"use client";

import { PanelRight } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
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
      <div className="fixed top-4 right-4 z-40 md:hiddenj b-dev">
        <SidebarTrigger>
          <PanelRight className="h-4 w-4" />
          <span className="sr-only">Toggle Sidebar</span>
        </SidebarTrigger>
      </div>
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
