import { create } from "zustand";
import type { AgentPhase, ShoppingResult, ShoppingQuery } from "@/types";

interface AgentState {
  phase: AgentPhase;
  query: ShoppingQuery | null;
  results: ShoppingResult[];
  narration: string;
  error: string | null;
  savedPick: ShoppingResult | null;
  savedItems: ShoppingResult[];

  goodResults: () => ShoppingResult[];
  badResults: () => ShoppingResult[];
  topPick: () => ShoppingResult | null;

  setPhase: (phase: AgentPhase) => void;
  setQuery: (query: ShoppingQuery) => void;
  addResult: (result: ShoppingResult) => void;
  setNarration: (text: string) => void;
  setError: (error: string | null) => void;
  dismissResult: (id: string) => void;
  dismissAllBad: () => void;
  savePick: (result: ShoppingResult) => void;
  reset: () => void;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  phase: "idle",
  query: null,
  results: [],
  narration: "",
  error: null,
  savedPick: null,
  savedItems:
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("sentinel_saves") || "[]")
      : [],

  goodResults: () =>
    get().results.filter((r) => r.fraud.isSafe && !r.dismissed),

  badResults: () =>
    get().results.filter((r) => !r.fraud.isSafe && !r.dismissed),

  topPick: () => {
    const good = get().goodResults();
    if (good.length === 0) return null;
    return good.reduce((best, r) =>
      r.product.price < best.product.price ? r : best
    );
  },

  setPhase: (phase) => set({ phase }),
  setQuery: (query) => set({ query }),
  addResult: (result) =>
    set((s) => ({ results: [...s.results, result] })),
  setNarration: (text) => set({ narration: text }),
  setError: (error) => set({ error }),
  dismissResult: (id) =>
    set((s) => ({
      results: s.results.map((r) =>
        r.id === id ? { ...r, dismissed: true } : r
      ),
    })),
  dismissAllBad: () =>
    set((s) => ({
      results: s.results.map((r) =>
        !r.fraud.isSafe ? { ...r, dismissed: true } : r
      ),
    })),
  savePick: (result) => {
    const saved = get().savedItems;
    const updated = [...saved, result];
    if (typeof window !== "undefined") {
      localStorage.setItem("sentinel_saves", JSON.stringify(updated));
    }
    set({ savedPick: result, savedItems: updated, phase: "saved" });
  },
  reset: () =>
    set({
      phase: "idle",
      query: null,
      results: [],
      narration: "",
      error: null,
      savedPick: null,
    }),
}));
