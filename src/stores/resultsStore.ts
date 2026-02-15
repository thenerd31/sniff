// src/stores/resultsStore.ts
"use client";

import { useMemo } from "react";
import { create } from "zustand";
import type {
  ProductResult,
  FraudCheck,
  ProductVerdict,
  ProductWithVerdict,
  ResultsPhase,
} from "@/types";
import { useSavedDashboardStore } from "./savedDashboardStore";

interface ResultsState {
  phase: ResultsPhase;
  products: Record<string, ProductResult>;
  checks: Record<string, FraudCheck[]>;
  verdicts: Record<string, { verdict: ProductVerdict; trustScore: number }>;
  bestPickId: string | null;
  savedItems: string[];
  doneSummary: string | null;

  addProduct: (product: ProductResult) => void;
  addFraudCheck: (productId: string, check: FraudCheck) => void;
  setVerdict: (productId: string, verdict: ProductVerdict, trustScore: number) => void;
  setBestPick: (productId: string) => void;
  setPhase: (phase: ResultsPhase) => void;
  setDoneSummary: (summary: string) => void;
  toggleSave: (productId: string) => void;
  reset: () => void;
}

const loadSavedItems = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem("sentinel-saved-items");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const persistSavedItems = (items: string[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("sentinel-saved-items", JSON.stringify(items));
  } catch {}
};

export const useResultsStore = create<ResultsState>((set) => ({
  phase: "hidden",
  products: {},
  checks: {},
  verdicts: {},
  bestPickId: null,
  savedItems: loadSavedItems(),
  doneSummary: null,

  addProduct: (product) =>
    set((state) => ({
      products: { ...state.products, [product.id]: product },
    })),

  addFraudCheck: (productId, check) =>
    set((state) => ({
      checks: {
        ...state.checks,
        [productId]: [...(state.checks[productId] || []), check],
      },
    })),

  setVerdict: (productId, verdict, trustScore) =>
    set((state) => ({
      verdicts: {
        ...state.verdicts,
        [productId]: { verdict, trustScore },
      },
    })),

  setBestPick: (productId) => set({ bestPickId: productId }),
  setPhase: (phase) => set({ phase }),
  setDoneSummary: (summary) => set({ doneSummary: summary }),

  toggleSave: (productId) =>
    set((state) => {
      const isSaved = state.savedItems.includes(productId);
      const next = isSaved
        ? state.savedItems.filter((id) => id !== productId)
        : [...state.savedItems, productId];
      persistSavedItems(next);

      // Sync with dashboard store
      const dashStore = useSavedDashboardStore.getState();
      if (isSaved) {
        dashStore.removeProduct(productId);
      } else {
        // Build the full ProductWithVerdict snapshot
        const product = state.products[productId];
        const verdict = state.verdicts[productId];
        if (product && verdict) {
          dashStore.saveProduct({
            ...product,
            checks: state.checks[productId] || [],
            verdict: verdict.verdict,
            trustScore: verdict.trustScore,
          });
        }
      }

      return { savedItems: next };
    }),

  reset: () =>
    set({
      phase: "hidden",
      products: {},
      checks: {},
      verdicts: {},
      bestPickId: null,
      doneSummary: null,
    }),
}));

// ── Memoized derived selectors ───────────────────────────────────────────

export function useProductsWithVerdicts(): ProductWithVerdict[] {
  const products = useResultsStore((s) => s.products);
  const checks = useResultsStore((s) => s.checks);
  const verdicts = useResultsStore((s) => s.verdicts);

  return useMemo(() => {
    const result: ProductWithVerdict[] = [];
    for (const id in products) {
      const v = verdicts[id];
      if (v) {
        result.push({
          ...products[id],
          checks: checks[id] || [],
          verdict: v.verdict,
          trustScore: v.trustScore,
        });
      }
    }
    return result;
  }, [products, checks, verdicts]);
}

export function useTrusted(): ProductWithVerdict[] {
  const all = useProductsWithVerdicts();
  return useMemo(
    () => all.filter((p) => p.verdict === "trusted" || p.verdict === "caution"),
    [all]
  );
}

export function useFlagged(): ProductWithVerdict[] {
  const all = useProductsWithVerdicts();
  return useMemo(() => all.filter((p) => p.verdict === "danger"), [all]);
}

export function useSortedTrusted(): ProductWithVerdict[] {
  const trusted = useTrusted();
  return useMemo(() => [...trusted].sort((a, b) => a.price - b.price), [trusted]);
}
