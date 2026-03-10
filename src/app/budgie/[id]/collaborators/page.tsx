"use client";

import { ContributorsList } from "@/components/contributors-list";
import { useBudgieDetail } from "../budgie-detail-context";

export default function CollaboratorsTabPage() {
  const { budgieId, isAdmin, contributorsWithSessionFirst } = useBudgieDetail();

  return (
    <ContributorsList
      budgieId={budgieId}
      contributors={contributorsWithSessionFirst.map((c) => ({
        id: c.id,
        name: c.name,
        user: c.user
          ? {
              email: c.user.email,
              name: c.user.name,
              imageUrl: c.user.imageUrl,
            }
          : null,
      }))}
      isAdmin={isAdmin}
    />
  );
}
