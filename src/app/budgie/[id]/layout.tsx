import { BudgieSidebarLayout } from "./budgie-sidebar-layout";
import { BudgieDetailLayout } from "./budgie-detail-layout";

export default function BudgieLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BudgieSidebarLayout>
      <BudgieDetailLayout>{children}</BudgieDetailLayout>
    </BudgieSidebarLayout>
  );
}
