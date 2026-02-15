// src/stores/savedDashboardStore.ts
"use client";

import { useMemo } from "react";
import { create } from "zustand";
import type { ProductWithVerdict } from "@/types";
import type {
  SavedProductSnapshot,
  DashboardStats,
  DashboardSortOrder,
} from "@/types/dashboard";

// ── localStorage helpers ─────────────────────────────────────────────────

const STORAGE_KEY = "sniff-saved-dashboard";

const loadSavedDashboard = (): Record<string, SavedProductSnapshot> => {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const persistSavedDashboard = (
  items: Record<string, SavedProductSnapshot>
) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
};

// ── Store ────────────────────────────────────────────────────────────────

interface DashboardState {
  savedProducts: Record<string, SavedProductSnapshot>;
  saveProduct: (product: ProductWithVerdict) => void;
  removeProduct: (productId: string) => void;
  clearAll: () => void;
}

export const useSavedDashboardStore = create<DashboardState>((set) => ({
  savedProducts: loadSavedDashboard(),

  saveProduct: (product) =>
    set((state) => {
      const snapshot: SavedProductSnapshot = {
        id: product.id,
        savedAt: new Date().toISOString(),
        product,
      };
      const next = { ...state.savedProducts, [product.id]: snapshot };
      persistSavedDashboard(next);
      return { savedProducts: next };
    }),

  removeProduct: (productId) =>
    set((state) => {
      const next = { ...state.savedProducts };
      delete next[productId];
      persistSavedDashboard(next);
      return { savedProducts: next };
    }),

  clearAll: () => {
    persistSavedDashboard({});
    set({ savedProducts: {} });
  },
}));

// ── Derived selectors ────────────────────────────────────────────────────

export function useSavedProductsList(
  sortOrder: DashboardSortOrder = "newest"
): SavedProductSnapshot[] {
  const savedProducts = useSavedDashboardStore((s) => s.savedProducts);

  return useMemo(() => {
    const list = Object.values(savedProducts);

    switch (sortOrder) {
      case "newest":
        return list.sort(
          (a, b) =>
            new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
        );
      case "oldest":
        return list.sort(
          (a, b) =>
            new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime()
        );
      case "score-high":
        return list.sort(
          (a, b) => b.product.trustScore - a.product.trustScore
        );
      case "score-low":
        return list.sort(
          (a, b) => a.product.trustScore - b.product.trustScore
        );
      case "price-low":
        return list.sort((a, b) => a.product.price - b.product.price);
      case "price-high":
        return list.sort((a, b) => b.product.price - a.product.price);
      default:
        return list;
    }
  }, [savedProducts, sortOrder]);
}

export function useDashboardStats(): DashboardStats {
  const savedProducts = useSavedDashboardStore((s) => s.savedProducts);

  return useMemo(() => {
    const list = Object.values(savedProducts);
    const totalSaved = list.length;

    if (totalSaved === 0) {
      return {
        totalSaved: 0,
        averageTrustScore: 0,
        trustedCount: 0,
        cautionCount: 0,
        dangerCount: 0,
      };
    }

    let totalScore = 0;
    let trustedCount = 0;
    let cautionCount = 0;
    let dangerCount = 0;

    for (const snap of list) {
      totalScore += snap.product.trustScore;
      switch (snap.product.verdict) {
        case "trusted":
          trustedCount++;
          break;
        case "caution":
          cautionCount++;
          break;
        case "danger":
          dangerCount++;
          break;
      }
    }

    return {
      totalSaved,
      averageTrustScore: Math.round(totalScore / totalSaved),
      trustedCount,
      cautionCount,
      dangerCount,
    };
  }, [savedProducts]);
}
