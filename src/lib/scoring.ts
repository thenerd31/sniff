import type { EvidenceCard } from "@/types";
import { isHighAuthorityDomain } from "./known-domains";

/**
 * Incremental additive score — used for real-time UX streaming while tools run.
 * The final score is overridden by computeFinalThreatScore after all tools complete.
 */
export function calcIncrementalScore(
  current: number,
  card: EvidenceCard
): number {
  const weights: Record<string, number> = {
    critical: 20,
    warning: 10,
    info: 2,
    safe: -5,
  };
  return Math.max(0, Math.min(100, current + (weights[card.severity] ?? 0)));
}

/**
 * Critical Veto scoring — applies a tiered hierarchy after ALL cards are collected.
 * First matching tier wins. Higher tiers override any incremental score.
 *
 * Tier 4 (Score 0):   High-authority domain (Tranco list) → immediate SAFE
 * Tier 1 (Score 100): Brand impersonation (high conf) OR Safe Browsing match → RED
 * Tier 2 (Score 75):  Young domain (<30d) AND free SSL cert → HIGH RISK
 * Tier 3 (Score 45):  Scraper red flags (urgency, missing policies) → WARNING
 * Fallback:           Additive score from card severities
 */
export function computeFinalThreatScore(
  cards: EvidenceCard[],
  url: string
): number {
  let hostname: string;
  try {
    hostname = new URL(url).hostname;
  } catch {
    // If URL is malformed, skip the authority check
    hostname = "";
  }

  // ── Tier 4: Known safe ─────────────────────────────────────────────
  if (hostname && isHighAuthorityDomain(hostname)) {
    return 0;
  }

  // ── Tier 1: Critical veto → immediate RED ──────────────────────────
  const hasBrandImpersonation = cards.some(
    (c) =>
      c.source === "Brand Impersonation" &&
      c.severity === "critical" &&
      typeof c.metadata?.confidence === "number" &&
      c.metadata.confidence >= 0.8
  );

  const hasSafeBrowsingMatch = cards.some(
    (c) => c.source === "Google Safe Browsing" && c.severity === "critical"
  );

  if (hasBrandImpersonation || hasSafeBrowsingMatch) {
    return 100;
  }

  // ── Tier 2: Young domain + free SSL → HIGH RISK ────────────────────
  const hasYoungDomain = cards.some(
    (c) =>
      c.type === "domain" &&
      c.severity === "critical" &&
      c.source === "WHOIS Lookup"
  );

  const hasFreeSSL = cards.some(
    (c) =>
      c.type === "ssl" &&
      typeof c.metadata?.issuer === "string" &&
      /let'?s\s*encrypt|zerossl|buypass|cloudflare/i.test(c.metadata.issuer)
  );

  if (hasYoungDomain && hasFreeSSL) {
    return 75;
  }

  // ── Tier 2.5: Critical seller failure → HIGH RISK ──────────────────
  // Bad seller signals: account < 3 months, rating < 3.5★, fake reviews
  const hasFailedSeller = cards.some(
    (c) => c.source === "Seller Verification" && c.severity === "critical"
  );

  if (hasFailedSeller) {
    return 65;
  }

  // ── Tier 3: Scraper red flags → WARNING ────────────────────────────
  const scraperRedFlags = cards.filter(
    (c) =>
      c.source === "Web Scraper" &&
      (c.severity === "warning" || c.severity === "critical")
  );

  if (scraperRedFlags.length > 0) {
    return 45;
  }

  // ── Fallback: additive score ───────────────────────────────────────
  let score = 0;
  for (const card of cards) {
    score = calcIncrementalScore(score, card);
  }
  return score;
}
