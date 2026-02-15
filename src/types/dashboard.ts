// ── Saved Items Dashboard Types ──────────────────────────────────────────

import type { ProductWithVerdict } from "@/types";

export interface SavedProductSnapshot {
  id: string;
  savedAt: string; // ISO timestamp
  product: ProductWithVerdict; // Full snapshot of product + verdict + checks
}

export interface DashboardStats {
  totalSaved: number;
  averageTrustScore: number;
  trustedCount: number;
  cautionCount: number;
  dangerCount: number;
}

export type DashboardSortOrder =
  | "newest"
  | "oldest"
  | "score-high"
  | "score-low"
  | "price-low"
  | "price-high";
