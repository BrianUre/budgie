"use client";

import { CategoriesCard } from "@/components/categories-card";
import { useBudgieDetail } from "../budgie-detail-context";

export default function CategoriesTabPage() {
  const { budgieId, isAdmin, categories } = useBudgieDetail();

  return (
    <CategoriesCard
      budgieId={budgieId}
      isAdmin={isAdmin}
      categories={categories}
    />
  );
}
