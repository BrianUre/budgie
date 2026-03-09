import { BudgieSidebarLayout } from "./budgie-sidebar-layout";

export default function BudgieLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BudgieSidebarLayout>{children}</BudgieSidebarLayout>;
}
