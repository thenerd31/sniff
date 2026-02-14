// src/types/index.ts
// SHARED CONTRACT — Frontend and Backend must agree on these types.

export type CardSeverity = "critical" | "warning" | "info" | "safe";

export type CardType =
  | "domain"
  | "ssl"
  | "scam_report"
  | "review_analysis"
  | "price"
  | "seller"
  | "business"
  | "alert"
  | "email"
  | "alternative"
  | "coupon";

export interface EvidenceCard {
  id: string;
  type: CardType;
  severity: CardSeverity;
  title: string;        // Short: "Domain registered 6 days ago"
  detail: string;       // Longer: "Registered Feb 7, 2026 via NameCheap in Lagos, Nigeria"
  source: string;       // "WHOIS Lookup" | "Google Safe Browsing" | "Reddit" | etc.
  confidence: number;   // 0.0 - 1.0
  connections: string[]; // IDs of cards this connects to
  metadata: Record<string, any>; // Flexible extra data
}

export interface PriceCard extends EvidenceCard {
  type: "price";
  metadata: {
    retailer: string;
    price: number;
    currency: string;
    url: string;
    inStock: boolean;
    priceHistory?: { date: string; price: number }[];
  };
}

export interface InvestigationState {
  id: string;
  url: string;
  cards: EvidenceCard[];
  connections: { from: string; to: string; label?: string }[];
  threatScore: number;       // 0-100
  savingsAmount?: number;    // for price comparison mode
  status: "investigating" | "complete" | "error";
  turn: number;
}

// API Request/Response types
export interface InvestigateRequest {
  url: string;
}

export interface DeepenRequest {
  investigationId: string;
  focus: "seller" | "reviews" | "business" | "alternatives" | "price_history";
}

export interface CompareRequest {
  productUrl: string;
}

// Server-Sent Event types (streamed to frontend)
export type SSEEvent =
  | { event: "card"; data: EvidenceCard }
  | { event: "connection"; data: { from: string; to: string; label?: string } }
  | { event: "threat_score"; data: { score: number } }
  | { event: "narration"; data: { text: string } }
  | { event: "done"; data: { summary: string } }
  | { event: "error"; data: { message: string } };

// ── Shopping Agent Types ─────────────────────────────────────────────────

export interface ProductResult {
  id: string;
  title: string;
  price: number;
  currency: string;
  retailer: string;
  domain: string;
  url: string;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  snippet?: string;
}

export type FraudCheckName =
  | "Retailer Reputation"
  | "Safety Database"
  | "Community Sentiment"
  | "Seller Verification";

export type FraudCheckStatus = "passed" | "warning" | "failed" | "pending";

export interface FraudCheck {
  name: FraudCheckName;
  status: FraudCheckStatus;
  detail: string;
  severity: number; // 0.0 - 1.0
}

export type ProductVerdict = "trusted" | "caution" | "danger";

export interface ProductWithVerdict extends ProductResult {
  checks: FraudCheck[];
  verdict: ProductVerdict;
  trustScore: number; // 0-100
}

export interface SearchRequest {
  query?: string;
  image?: string; // base64 encoded
  url?: string;   // product URL to find alternatives for
}

export type SearchSSEEvent =
  | { event: "narration"; data: { text: string } }
  | { event: "product"; data: ProductResult }
  | { event: "fraud_check"; data: { productId: string; check: FraudCheck } }
  | { event: "verdict"; data: { productId: string; verdict: ProductVerdict; trustScore: number } }
  | { event: "all_products"; data: { count: number } }
  | { event: "best_pick"; data: { productId: string; savings?: number } }
  | { event: "done"; data: { summary: string; totalProducts: number; trustedCount: number; flaggedCount: number } }
  | { event: "error"; data: { message: string } };

// ── Results UI Phase ─────────────────────────────────────────────────────

export type ResultsPhase =
  | "hidden"
  | "two-columns"
  | "wiping"
  | "shuffling"
  | "final-list";
