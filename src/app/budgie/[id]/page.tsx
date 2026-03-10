import { redirect } from "next/navigation";

export default function BudgieViewPage({
  params,
}: {
  params: { id: string };
}) {
  redirect(`/budgie/${params.id}/expenses`);
}
