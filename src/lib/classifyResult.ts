import type { EvidenceCard, ShoppingResult, FraudMarker } from "@/types";

const FRAUD_THRESHOLD = 40;

const severityScores: Record<string, number> = {
  critical: 90,
  warning: 55,
  info: 20,
  safe: 5,
};

export function transformCardToResult(card: EvidenceCard): ShoppingResult {
  const fraudScore = severityScores[card.severity] ?? 30;

  const marker: FraudMarker = {
    type: card.type,
    severity: card.severity,
    label: card.title,
    detail: card.detail,
    source: card.source,
  };

  return {
    id: card.id,
    product: {
      name: card.metadata?.retailer
        ? `${card.title} — ${card.metadata.retailer}`
        : card.title,
      price: card.metadata?.price ?? 0,
      currency: card.metadata?.currency ?? "USD",
      retailer: card.metadata?.retailer ?? card.source,
      url: card.metadata?.url ?? "",
      imageUrl: card.metadata?.imageUrl,
      inStock: card.metadata?.inStock ?? true,
    },
    fraud: {
      score: fraudScore,
      isSafe: fraudScore < FRAUD_THRESHOLD,
      markers: [marker],
    },
    evidenceCards: [card],
    dismissed: false,
  };
}
