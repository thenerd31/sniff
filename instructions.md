Yifan
You own everything in src/app/api/ and src/lib/tools/. You build the API routes that Davyn's frontend calls, and the tool functions that Aswin's agent invokes.
Shared Types (Everyone reads this first)
Create src/types/index.ts — this is the CONTRACT between frontend and backend.
// src/types/index.ts

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

DAVYN — Frontend Step-by-Step
You own everything in src/components/, src/app/page.tsx, and src/stores/. You talk to Yifan's API routes via fetch + SSE. You never write backend code.

ASWIN — Agent Architecture Step-by-Step
You own the agent system prompt, tool definitions, and orchestration logic. You work closely with Yifan (he builds the tools, you decide how the agent uses them).

