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

// ── Shopping Agent Types ───────────────────────────────────────────────

export type AgentPhase =
  | "idle"
  | "searching"
  | "reviewing"
  | "swiping"
  | "sorting"
  | "picked"
  | "saved";

export interface ShoppingQuery {
  text: string;
  imageFile?: File;
}

export interface FraudMarker {
  type: CardType;
  severity: CardSeverity;
  label: string;
  detail: string;
  source: string;
}

export interface ShoppingResult {
  id: string;
  product: {
    name: string;
    price: number;
    currency: string;
    retailer: string;
    url: string;
    imageUrl?: string;
    inStock: boolean;
  };
  fraud: {
    score: number;
    isSafe: boolean;
    markers: FraudMarker[];
  };
  evidenceCards: EvidenceCard[];
  dismissed: boolean;
}
