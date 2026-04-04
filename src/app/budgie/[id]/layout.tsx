import { BudgieDetailLayout } from "./budgie-detail-layout";

export default function BudgieLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BudgieDetailLayout>{children}</BudgieDetailLayout>;
}
