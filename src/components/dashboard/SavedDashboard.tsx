"use client";

import { useState, useCallback } from "react";
import {
  useSavedDashboardStore,
  useSavedProductsList,
  useDashboardStats,
} from "@/stores/savedDashboardStore";
import { DashboardHeader } from "./DashboardHeader";
import { SavedItemCard } from "./SavedItemCard";
import { EmptyDashboard } from "./EmptyDashboard";
import type { DashboardSortOrder } from "@/types/dashboard";

export function SavedDashboard() {
  const [sortOrder, setSortOrder] = useState<DashboardSortOrder>("newest");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const products = useSavedProductsList(sortOrder);
  const stats = useDashboardStats();
  const removeProduct = useSavedDashboardStore((s) => s.removeProduct);

  const handleToggleExpand = useCallback(
    (id: string) => {
      setExpandedId((prev) => (prev === id ? null : id));
    },
    []
  );

  const handleRemove = useCallback(
    (id: string) => {
      // If the removed card was expanded, close it
      if (expandedId === id) setExpandedId(null);
      removeProduct(id);
    },
    [expandedId, removeProduct]
  );

  if (products.length === 0) {
    return <EmptyDashboard />;
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <DashboardHeader
        stats={stats}
        sortOrder={sortOrder}
        onSortChange={setSortOrder}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {products.map((snapshot, i) => (
          <SavedItemCard
            key={snapshot.id}
            snapshot={snapshot}
            index={i}
            isExpanded={expandedId === snapshot.id}
            onToggleExpand={() => handleToggleExpand(snapshot.id)}
            onRemove={() => handleRemove(snapshot.id)}
          />
        ))}
      </div>
    </div>
  );
}
