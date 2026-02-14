// src/stores/resultsStore.ts
// Zustand store for bottom-half results UI state

import { create } from "zustand";
import type {
  ProductResult,
  FraudCheck,
  ProductVerdict,
  ProductWithVerdict,
  ResultsPhase,
} from "@/types";

interface ResultsState {
  phase: ResultsPhase;
  products: Map<string, ProductResult>;
  checks: Map<string, FraudCheck[]>;
  verdicts: Map<string, { verdict: ProductVerdict; trustScore: number }>;
  bestPickId: string | null;
  savedItems: string[];
  doneSummary: string | null;

  // Actions
  addProduct: (product: ProductResult) => void;
  addFraudCheck: (productId: string, check: FraudCheck) => void;
  setVerdict: (productId: string, verdict: ProductVerdict, trustScore: number) => void;
  setBestPick: (productId: string) => void;
  setPhase: (phase: ResultsPhase) => void;
  setDoneSummary: (summary: string) => void;
  toggleSave: (productId: string) => void;
  markAllProductsReady: () => void;
  reset: () => void;

  // Computed helpers
  getProductsWithVerdicts: () => ProductWithVerdict[];
  getTrusted: () => ProductWithVerdict[];
  getFlagged: () => ProductWithVerdict[];
  getSortedTrusted: () => ProductWithVerdict[];
}

// Load saved items from localStorage
const loadSavedItems = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem("sentinel-saved-items");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

// Persist saved items to localStorage
const persistSavedItems = (items: string[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("sentinel-saved-items", JSON.stringify(items));
  } catch {
    // silently fail
  }
};

export const useResultsStore = create<ResultsState>((set, get) => ({
  phase: "hidden",
  products: new Map(),
  checks: new Map(),
  verdicts: new Map(),
  bestPickId: null,
  savedItems: loadSavedItems(),
  doneSummary: null,

  addProduct: (product) =>
    set((state) => {
      const next = new Map(state.products);
      next.set(product.id, product);
      return { products: next };
    }),

  addFraudCheck: (productId, check) =>
    set((state) => {
      const next = new Map(state.checks);
      const existing = next.get(productId) || [];
      next.set(productId, [...existing, check]);
      return { checks: next };
    }),

  setVerdict: (productId, verdict, trustScore) =>
    set((state) => {
      const next = new Map(state.verdicts);
      next.set(productId, { verdict, trustScore });
      return { verdicts: next };
    }),

  setBestPick: (productId) => set({ bestPickId: productId }),

  setPhase: (phase) => set({ phase }),

  setDoneSummary: (summary) => set({ doneSummary: summary }),

  toggleSave: (productId) =>
    set((state) => {
      const next = state.savedItems.includes(productId)
        ? state.savedItems.filter((id) => id !== productId)
        : [...state.savedItems, productId];
      persistSavedItems(next);
      return { savedItems: next };
    }),

  markAllProductsReady: () => {
    const state = get();
    // Only transition to two-columns if we have verdicts
    if (state.verdicts.size > 0 && state.phase === "hidden") {
      set({ phase: "two-columns" });
    }
  },

  reset: () =>
    set({
      phase: "hidden",
      products: new Map(),
      checks: new Map(),
      verdicts: new Map(),
      bestPickId: null,
      doneSummary: null,
    }),

  // Computed: merge products + checks + verdicts
  getProductsWithVerdicts: () => {
    const { products, checks, verdicts } = get();
    const result: ProductWithVerdict[] = [];
    products.forEach((product, id) => {
      const v = verdicts.get(id);
      if (v) {
        result.push({
          ...product,
          checks: checks.get(id) || [],
          verdict: v.verdict,
          trustScore: v.trustScore,
        });
      }
    });
    return result;
  },

  // Trusted: score >= 75 OR verdict === "trusted" OR verdict === "caution"
  getTrusted: () => {
    return get()
      .getProductsWithVerdicts()
      .filter((p) => p.verdict === "trusted" || p.verdict === "caution");
  },

  // Flagged: verdict === "danger"
  getFlagged: () => {
    return get()
      .getProductsWithVerdicts()
      .filter((p) => p.verdict === "danger");
  },

  // Sorted by price ascending
  getSortedTrusted: () => {
    return get()
      .getTrusted()
      .sort((a, b) => a.price - b.price);
  },
}));
