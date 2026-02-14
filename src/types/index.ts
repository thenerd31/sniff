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
  title: string;
  detail: string;
  source: string;
  confidence: number;
  connections: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any>;
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
  threatScore: number;
  savingsAmount?: number;
  status: "investigating" | "complete" | "error";
  turn: number;
}

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

export type SSEEvent =
  | { event: "card"; data: EvidenceCard }
  | { event: "connection"; data: { from: string; to: string; label?: string } }
  | { event: "threat_score"; data: { score: number } }
  | { event: "narration"; data: { text: string } }
  | { event: "done"; data: { summary: string } }
  | { event: "error"; data: { message: string } };
