import type { EvidenceCard, CardSeverity } from "@/types";

// ── Public Types ───────────────────────────────────────────────────────

export interface ReportInput {
  url: string;
  cards: EvidenceCard[];
  connections: { from: string; to: string; label?: string }[];
  threatScore: number;
  savingsAmount?: number;
}

export interface ReportSection {
  heading: string;
  content: string;
}

export type ThreatLevel = "CRITICAL" | "HIGH" | "MODERATE" | "LOW" | "SAFE";

export interface GeneratedReport {
  title: string;
  generatedAt: string;
  threatLevel: ThreatLevel;
  sections: ReportSection[];
  fullText: string;
}

// ── Helpers ────────────────────────────────────────────────────────────

function getThreatLevel(score: number): ThreatLevel {
  if (score >= 81) return "CRITICAL";
  if (score >= 61) return "HIGH";
  if (score >= 41) return "MODERATE";
  if (score >= 21) return "LOW";
  return "SAFE";
}

function getSeverityIcon(severity: CardSeverity): string {
  switch (severity) {
    case "critical":
      return "[!!!]";
    case "warning":
      return "[!!]";
    case "info":
      return "[i]";
    case "safe":
      return "[OK]";
  }
}

function formatConfidence(n: number): string {
  return `${Math.round(n * 100)}%`;
}

function formatCard(card: EvidenceCard): string {
  return [
    `  ${getSeverityIcon(card.severity)} ${card.title}`,
    `     ${card.detail}`,
    `     Source: ${card.source} | Confidence: ${formatConfidence(card.confidence)}`,
  ].join("\n");
}

function filterAndSort(
  cards: EvidenceCard[],
  severity: CardSeverity
): EvidenceCard[] {
  return cards
    .filter((c) => c.severity === severity)
    .sort((a, b) => b.confidence - a.confidence);
}

// ── Section Builders ───────────────────────────────────────────────────

function buildThreatSummary(score: number, level: ThreatLevel): ReportSection {
  const descriptions: Record<ThreatLevel, string> = {
    CRITICAL:
      "Multiple strong indicators of fraud detected. Do NOT proceed with any transactions.",
    HIGH: "Several suspicious indicators found. Proceed with extreme caution.",
    MODERATE:
      "Some concerns identified. Verify through independent channels before transacting.",
    LOW: "Minor concerns noted. Generally appears legitimate but exercise normal caution.",
    SAFE: "No significant red flags detected. Standard online shopping precautions apply.",
  };

  return {
    heading: "THREAT ASSESSMENT",
    content: `Threat Score: ${score}/100 — ${level}\n${descriptions[level]}`,
  };
}

function buildCardSection(
  heading: string,
  cards: EvidenceCard[]
): ReportSection | null {
  if (cards.length === 0) return null;
  return {
    heading: `${heading} (${cards.length})`,
    content: cards.map(formatCard).join("\n\n"),
  };
}

function buildConnectionsSection(
  connections: ReportInput["connections"],
  cards: EvidenceCard[]
): ReportSection | null {
  if (connections.length === 0) return null;

  const cardMap = new Map(cards.map((c) => [c.id, c.title]));

  const lines = connections.map((conn) => {
    const from = cardMap.get(conn.from) || conn.from;
    const to = cardMap.get(conn.to) || conn.to;
    const label = conn.label ? ` (${conn.label})` : "";
    return `  ${from}  -->  ${to}${label}`;
  });

  return {
    heading: "EVIDENCE CONNECTIONS",
    content: lines.join("\n"),
  };
}

function buildPriceSection(
  cards: EvidenceCard[],
  savingsAmount?: number
): ReportSection | null {
  const priceCards = cards.filter((c) => c.type === "price");
  if (priceCards.length === 0) return null;

  const lines = priceCards.map((c) => {
    const price = c.metadata?.price;
    const retailer = c.metadata?.retailer || c.source;
    const inStock = c.metadata?.inStock;
    const stockLabel =
      inStock === true ? "In Stock" : inStock === false ? "Out of Stock" : "";
    const priceStr = typeof price === "number" ? `$${price.toFixed(2)}` : "N/A";
    return `  ${retailer}: ${priceStr}${stockLabel ? ` (${stockLabel})` : ""}`;
  });

  if (savingsAmount && savingsAmount > 0) {
    lines.push(`\n  Potential savings: $${savingsAmount.toFixed(2)}`);
  }

  return {
    heading: "PRICE COMPARISON",
    content: lines.join("\n"),
  };
}

function buildRecommendations(level: ThreatLevel): ReportSection {
  const recs: Record<ThreatLevel, string[]> = {
    CRITICAL: [
      "Do not enter any personal or payment information on this site.",
      "Do not proceed with any transactions.",
      "If you have already transacted, contact your bank or payment provider immediately.",
      "Report this site to the FTC at reportfraud.ftc.gov.",
    ],
    HIGH: [
      "Avoid making purchases on this site without further verification.",
      "Verify the seller through independent channels (BBB, Trustpilot, etc.).",
      "If you proceed, use a credit card with strong fraud protection.",
      "Check for the same product from established retailers.",
    ],
    MODERATE: [
      "Proceed with caution. Verify seller contact information before purchasing.",
      "Look for independent reviews outside the seller's website.",
      "Use a payment method with buyer protection.",
      "Save screenshots of product listings, prices, and policies.",
    ],
    LOW: [
      "This site appears generally trustworthy.",
      "Standard online shopping precautions apply.",
      "Compare prices across retailers before purchasing.",
    ],
    SAFE: [
      "No major concerns identified.",
      "Standard online shopping precautions apply.",
    ],
  };

  return {
    heading: "RECOMMENDATIONS",
    content: recs[level].map((r) => `  - ${r}`).join("\n"),
  };
}

function buildEvidenceSummary(cards: EvidenceCard[]): ReportSection {
  const counts: Record<CardSeverity, number> = {
    critical: 0,
    warning: 0,
    info: 0,
    safe: 0,
  };
  for (const card of cards) {
    counts[card.severity]++;
  }

  return {
    heading: "EVIDENCE SUMMARY",
    content: [
      `  Total evidence cards: ${cards.length}`,
      `  Critical: ${counts.critical}`,
      `  Warnings: ${counts.warning}`,
      `  Informational: ${counts.info}`,
      `  Safe indicators: ${counts.safe}`,
    ].join("\n"),
  };
}

// ── Main Generator ─────────────────────────────────────────────────────

export function generateReport(input: ReportInput): GeneratedReport {
  const { url, cards, connections, threatScore, savingsAmount } = input;
  const now = new Date().toISOString();
  const threatLevel = getThreatLevel(threatScore);
  const title = "SENTINEL FRAUD INVESTIGATION REPORT";

  const sections: ReportSection[] = [];

  // Header info as first section
  sections.push({
    heading: "INVESTIGATION DETAILS",
    content: [
      `URL: ${url}`,
      `Generated: ${now}`,
      `Threat Level: ${threatLevel} (${threatScore}/100)`,
    ].join("\n"),
  });

  // Threat summary
  sections.push(buildThreatSummary(threatScore, threatLevel));

  // Card sections by severity
  const criticalSection = buildCardSection(
    "CRITICAL FINDINGS",
    filterAndSort(cards, "critical")
  );
  if (criticalSection) sections.push(criticalSection);

  const warningSection = buildCardSection(
    "WARNINGS",
    filterAndSort(cards, "warning")
  );
  if (warningSection) sections.push(warningSection);

  const infoSection = buildCardSection(
    "INFORMATIONAL",
    filterAndSort(cards, "info")
  );
  if (infoSection) sections.push(infoSection);

  const safeSection = buildCardSection(
    "POSITIVE INDICATORS",
    filterAndSort(cards, "safe")
  );
  if (safeSection) sections.push(safeSection);

  // Connections
  const connSection = buildConnectionsSection(connections, cards);
  if (connSection) sections.push(connSection);

  // Price comparison
  const priceSection = buildPriceSection(cards, savingsAmount);
  if (priceSection) sections.push(priceSection);

  // Recommendations
  sections.push(buildRecommendations(threatLevel));

  // Evidence summary
  sections.push(buildEvidenceSummary(cards));

  // Build full text
  const divider = "=".repeat(60);
  const sectionDivider = "-".repeat(60);

  const fullText = [
    divider,
    `  ${title}`,
    divider,
    "",
    ...sections.flatMap((s) => [sectionDivider, s.heading, sectionDivider, s.content, ""]),
    divider,
    "  Generated by Sentinel AI Shopping Investigator",
    `  ${now}`,
    "  For fraud reports, visit reportfraud.ftc.gov",
    divider,
  ].join("\n");

  return {
    title,
    generatedAt: now,
    threatLevel,
    sections,
    fullText,
  };
}
