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

/** Raw product result from Google Shopping (serpSearch.ts). */
export interface ProductResult {
  id: string;
  title: string;
  price: number;          // USD number, 0 if unavailable
  currency: string;
  retailer: string;       // "Amazon", "Walmart", etc.
  domain: string;         // "amazon.com"
  url: string;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  snippet?: string;       // shipping tag, promo label, etc.
}

export interface ShoppingRequest {
  /** Free-text search query or product description (optional). */
  text?: string;
  /** Base64-encoded image bytes or full data-URI (optional). */
  imageBase64?: string;
  /** MIME type of the image, e.g. "image/jpeg" (optional). */
  imageMediaType?: string;
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

export type FraudCheckName =
  | "Retailer Reputation"
  | "Safety Database"
  | "Community Sentiment"
  | "Brand Impersonation"
  | "Page Red Flags";

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
  searchQueries?: string[]; // post-refinement query variants
}

// ── Query Refiner Types ───────────────────────────────────────────────────────

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface RefinementOption {
  /** Short vivid label, e.g. "The Streetwear Look" */
  label: string;
  /** One-line description of this lifestyle/use-case path */
  description: string;
  /** Keywords to append to the query if the user picks this option */
  value: string;
}

export type RefineResult =
  | {
      type: "question";
      question: string;
      options: RefinementOption[];
      internalReasoning: string;
    }
  | {
      type: "ready";
      refinedQuery: string;
      searchQueries: string[];
      internalReasoning: string;
    };

// ── Results UI Phase (animation state machine) ───────────────────────────

export type ResultsPhase =
  | "hidden"
  | "two-columns"
  | "wiping"
  | "shuffling"
  | "final-list";

export type SearchSSEEvent =
  | { event: "narration"; data: { text: string } }
  | { event: "product"; data: ProductResult }
  | { event: "fraud_check"; data: { productId: string; check: FraudCheck } }
  | { event: "verdict"; data: { productId: string; verdict: ProductVerdict; trustScore: number } }
  | { event: "all_products"; data: { count: number } }
  | { event: "best_pick"; data: { productId: string; savings?: number } }
  | { event: "done"; data: { summary: string; totalProducts: number; trustedCount: number; flaggedCount: number } }
  | { event: "error"; data: { message: string } };
