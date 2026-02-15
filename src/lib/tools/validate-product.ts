// src/lib/tools/validate-product.ts
// Per-product fraud validation for the shopping pipeline.
// Runs 5 independent checks and returns FraudCheck[] + computes a trust verdict.
//
// Checks:
//   1. Price Anomaly        — price vs. median of all results  → "Page Red Flags"
//   2. Brand Impersonation  — deterministic: domain contains brand name but isn't official  → "Brand Impersonation"
//   3. Semantic Domain      — LLM: is this domain a credible seller for this product?  → "Retailer Reputation"
//   4. Community Sentiment  — Reddit reputation of the domain  → "Community Sentiment"
//   5. Safety Database      — Google Safe Browsing + ScamAdviser  → "Safety Database"

import OpenAI from "openai";
import type {
  FraudCheck,
  FraudCheckStatus,
  ProductResult,
  ProductVerdict,
} from "@/types";
import { isHighAuthorityDomain, isKnownDangerousDomain } from "@/lib/known-domains";
import { redditSearch } from "./reddit";
import { safeBrowsingCheck } from "./safe-browsing";
import { scamadviserCheck } from "./scamadviser";

let _openai: OpenAI | null = null;
const getOpenAI = () => (_openai ??= new OpenAI());

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Compute the median price from a list of products (ignores price === 0). */
export function computeMedianPrice(products: ProductResult[]): number {
  const prices = products.map((p) => p.price).filter((p) => p > 0);
  if (prices.length === 0) return 0;
  prices.sort((a, b) => a - b);
  const mid = Math.floor(prices.length / 2);
  return prices.length % 2 === 0
    ? (prices[mid - 1] + prices[mid]) / 2
    : prices[mid];
}

// ── Check 1: Price Anomaly ─────────────────────────────────────────────────────
// Flags products priced suspiciously low relative to the market median.

export function priceAnomalyCheck(
  product: ProductResult,
  referencePrice: number
): FraudCheck {
  if (referencePrice <= 0 || product.price <= 0) {
    return {
      name: "Page Red Flags",
      status: "passed",
      detail: "Insufficient price data for comparison",
      severity: 0,
    };
  }

  const ratio = product.price / referencePrice;
  const pctBelow = Math.round((1 - ratio) * 100);

  if (ratio < 0.5) {
    return {
      name: "Page Red Flags",
      status: "failed",
      detail: `$${product.price.toFixed(2)} is ${pctBelow}% below the market median ($${referencePrice.toFixed(2)}) — suspiciously underpriced`,
      severity: 0.9,
    };
  }

  if (ratio < 0.7) {
    return {
      name: "Page Red Flags",
      status: "warning",
      detail: `$${product.price.toFixed(2)} is ${pctBelow}% below the market median ($${referencePrice.toFixed(2)}) — unusually low`,
      severity: 0.5,
    };
  }

  return {
    name: "Page Red Flags",
    status: "passed",
    detail: `Price $${product.price.toFixed(2)} is within normal range of market median ($${referencePrice.toFixed(2)})`,
    severity: 0,
  };
}

// ── Check 2: Brand Impersonation (deterministic) ────────────────────────────
// Catches domains like "ebayitsworthmore.com" or "amazonsale-deals.com" that
// embed a major brand/retailer name but aren't the official domain.

// Maps brand keywords → all legitimate domains that may contain that keyword.
// e.g. "nordstrom" appears in both nordstrom.com AND nordstromrack.com.
const BRAND_DOMAINS: Record<string, string[]> = {
  ebay: ["ebay.com"],
  amazon: ["amazon.com", "amazonwireless.com"],
  walmart: ["walmart.com"],
  apple: ["apple.com"],
  bestbuy: ["bestbuy.com"],
  target: ["target.com"],
  costco: ["costco.com"],
  nike: ["nike.com"],
  adidas: ["adidas.com"],
  samsung: ["samsung.com"],
  sony: ["sony.com"],
  bose: ["bose.com"],
  dell: ["dell.com"],
  newegg: ["newegg.com"],
  nordstrom: ["nordstrom.com", "nordstromrack.com"],
  macys: ["macys.com"],
  sephora: ["sephora.com"],
  wayfair: ["wayfair.com"],
  homedepot: ["homedepot.com"],
  lowes: ["lowes.com"],
  patagonia: ["patagonia.com"],
};

export function brandImpersonationCheck(domain: string): FraudCheck {
  const cleanDomain = domain.replace(/^www\./, "").toLowerCase();

  // High-authority domains never trigger brand impersonation
  if (isHighAuthorityDomain(cleanDomain)) {
    return {
      name: "Brand Impersonation",
      status: "passed",
      detail: "No brand impersonation detected",
      severity: 0,
    };
  }

  for (const [brand, officialDomains] of Object.entries(BRAND_DOMAINS)) {
    // Does the domain contain this brand name?
    if (!cleanDomain.includes(brand)) continue;
    // Is it any of the official domains (or a subdomain of one)?
    const isOfficial = officialDomains.some(
      (d) => cleanDomain === d || cleanDomain.endsWith(`.${d}`)
    );
    if (isOfficial) continue;

    return {
      name: "Brand Impersonation",
      status: "failed",
      detail: `"${cleanDomain}" contains "${brand}" but is NOT an official ${brand} domain — possible brand impersonation`,
      severity: 0.9,
    };
  }

  return {
    name: "Brand Impersonation",
    status: "passed",
    detail: "No brand impersonation detected",
    severity: 0,
  };
}

// ── Check 2b: URL Reachability ──────────────────────────────────────────────
// Quick HEAD request to verify the URL actually resolves.
// Catches constructed/fabricated links that return 404 or don't resolve.

export async function urlReachabilityCheck(url: string): Promise<FraudCheck> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const resp = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeout);

    if (resp.ok || resp.status === 405 || resp.status === 403) {
      // 405/403 = server exists but blocks HEAD — still reachable
      return {
        name: "Link Verification",
        status: "passed",
        detail: `URL is reachable (HTTP ${resp.status})`,
        severity: 0,
      };
    }

    if (resp.status === 404) {
      return {
        name: "Link Verification",
        status: "failed",
        detail: `URL returns 404 Not Found — this product link is invalid`,
        severity: 0.8,
      };
    }

    return {
      name: "Link Verification",
      status: "warning",
      detail: `URL returned HTTP ${resp.status} — may not be a valid product page`,
      severity: 0.3,
    };
  } catch {
    return {
      name: "Link Verification",
      status: "warning",
      detail: "Could not verify URL — site may be unreachable or blocking requests",
      severity: 0.25,
    };
  }
}

// ── Check 3: Semantic Domain ──────────────────────────────────────────────────
// LLM judges whether the domain is a *logical* seller for this product category.
// Catches cases like "energiacomunitaria.com" selling Sony headphones.

export async function semanticDomainCheck(
  domain: string,
  productTitle: string
): Promise<FraudCheck> {
  console.debug(`[semanticDomainCheck] checking domain="${domain}" for product="${productTitle}"`);
  try {
    const { choices } = await getOpenAI().chat.completions.create({
      model: "gpt-5-mini",
      temperature: 1,
      max_tokens: 200,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You decide whether a website domain is a LOGICAL seller for a given product.
Ask yourself: "Is this domain the kind of site that would naturally sell this product?"

NOT logical (flag these):
- Domain implies a completely different business category (e.g. "energiacomunitaria.com" selling Sony headphones, "petsupply.com" selling luxury watches, "churchsupplies.org" selling GPUs)
- Domain looks like a disposable scam site (random word combos, excessive hyphens, keyword-stuffed, suspicious TLD like .xyz/.top for non-brands)
- Domain contains the product brand but is NOT the brand's official site (e.g. "nikeshoes-discount.com" for Nike)

LOGICAL (pass these):
- Major known retailers: amazon.com, walmart.com, bestbuy.com, target.com, newegg.com, etc.
- Brand's own official domain (nike.com, apple.com, sony.com)
- Clearly relevant specialist (bhphotovideo.com for cameras, sweetwater.com for audio gear)

Respond ONLY with JSON:
{
  "isLogical": boolean,
  "confidence": 0.0-1.0,
  "domainCategory": "what this domain appears to be (e.g. 'energy/community NGO', 'major electronics retailer')",
  "reason": "one sentence explaining why it is or isn't logical"
}`,
        },
        {
          role: "user",
          content: `Is "${domain}" a logical seller for: "${productTitle}"?`,
        },
      ],
    });

    const rawContent = choices[0]?.message?.content ?? "{}";
    console.debug(`[semanticDomainCheck] response for "${domain}": ${rawContent}`);
    const raw = JSON.parse(rawContent);
    const isLogical: boolean = raw.isLogical !== false;
    const confidence: number =
      typeof raw.confidence === "number" ? raw.confidence : 0.7;
    const domainCategory: string =
      typeof raw.domainCategory === "string" ? raw.domainCategory : "";
    const reason: string =
      typeof raw.reason === "string"
        ? raw.reason
        : `"${domain}" as a seller for this product`;

    const detail = domainCategory
      ? `${domain} appears to be a ${domainCategory} — ${reason}`
      : reason;

    if (!isLogical && confidence >= 0.7) {
      return {
        name: "Retailer Reputation",
        status: "failed",
        detail,
        severity: 0.85,
      };
    }

    if (!isLogical && confidence >= 0.5) {
      return {
        name: "Retailer Reputation",
        status: "warning",
        detail,
        severity: 0.45,
      };
    }

    return {
      name: "Retailer Reputation",
      status: "passed",
      detail,
      severity: 0,
    };
  } catch (err) {
    console.debug(`[semanticDomainCheck] ERROR for "${domain}": ${err}`);
    return {
      name: "Retailer Reputation",
      status: "warning",
      detail: "Could not verify seller domain credibility",
      severity: 0.2,
    };
  }
}

// ── Check 3: Community Sentiment ──────────────────────────────────────────────
// Searches Reddit for scam reports / reviews of the domain.
// Zero Reddit presence is itself a mild warning for any claimed retailer.

export async function communityReputationCheck(url: string): Promise<FraudCheck> {
  const card = await redditSearch(url);
  const domain = new URL(url).hostname.replace(/^www\./, "");

  let status: FraudCheckStatus;
  let severity: number;
  let detail: string;

  switch (card.severity) {
    case "critical":
      status = "failed";
      severity = 0.95;
      detail = card.detail || card.title;
      break;
    case "warning":
      status = "warning";
      severity = 0.5;
      detail = card.detail || card.title;
      break;
    case "safe":
      status = "passed";
      severity = 0;
      detail = card.detail || card.title;
      break;
    default: {
      // "info" — covers "no posts found" and "only incidental mentions"
      const noPresence = (card.metadata.postCount ?? 0) === 0;
      status = noPresence ? "warning" : "passed";
      severity = noPresence ? 0.15 : 0; // Low: many legit retailers have no Reddit presence
      detail = noPresence
        ? `No Reddit mentions of "${domain}" — limited online presence`
        : card.detail || card.title;
    }
  }

  return { name: "Community Sentiment", status, detail, severity };
}

// ── Check 4: Safety Database ──────────────────────────────────────────────────
// Combines Google Safe Browsing + ScamAdviser. Worst result wins.

export async function safetyDatabaseCheck(url: string): Promise<FraudCheck> {
  const [safeCard, scamCard] = await Promise.all([
    safeBrowsingCheck(url),
    scamadviserCheck(url),
  ]);

  const hasCritical =
    safeCard.severity === "critical" || scamCard.severity === "critical";
  const hasWarning =
    safeCard.severity === "warning" || scamCard.severity === "warning";

  if (hasCritical) {
    return {
      name: "Safety Database",
      status: "failed",
      detail: [safeCard.title, scamCard.title].filter(Boolean).join(" · "),
      severity: 0.95,
    };
  }

  if (hasWarning) {
    return {
      name: "Safety Database",
      status: "warning",
      detail: [safeCard.title, scamCard.title].filter(Boolean).join(" · "),
      severity: 0.4,
    };
  }

  // Both skipped (no API keys) or both clean
  const bothSkipped =
    safeCard.metadata.skipped && scamCard.metadata.skipped;
  return {
    name: "Safety Database",
    status: bothSkipped ? "warning" : "passed",
    detail: bothSkipped
      ? "Safety checks skipped (API keys not configured)"
      : "Not flagged by Google Safe Browsing or ScamAdviser",
    severity: bothSkipped ? 0.15 : 0,
  };
}

// ── Orchestrator ───────────────────────────────────────────────────────────────

/**
 * Runs all fraud checks for a product in parallel.
 * Pass `referencePrice` = median of all results (use computeMedianPrice).
 */
export async function validateProduct(
  product: ProductResult,
  referencePrice: number
): Promise<FraudCheck[]> {
  // Known dangerous domains get instant danger — skip all checks
  if (isKnownDangerousDomain(product.domain)) {
    return [
      { name: "Page Red Flags", status: "failed", detail: `${product.domain} is a known fraudulent storefront`, severity: 1.0 },
      { name: "Brand Impersonation", status: "failed", detail: "Selling branded products through unverified storefront", severity: 0.9 },
      { name: "Retailer Reputation", status: "failed", detail: `${product.domain} — flagged as deceptive`, severity: 1.0 },
      { name: "Community Sentiment", status: "failed", detail: "Multiple scam reports found", severity: 0.9 },
      { name: "Safety Database", status: "failed", detail: "Flagged as deceptive commerce site", severity: 1.0 },
    ];
  }

  // High-authority domains get an instant pass — skip all expensive checks
  if (isHighAuthorityDomain(product.domain)) {
    return [
      { name: "Page Red Flags", status: "passed", detail: `${product.retailer} is a verified major retailer`, severity: 0 },
      { name: "Brand Impersonation", status: "passed", detail: "Official domain", severity: 0 },
      { name: "Retailer Reputation", status: "passed", detail: `${product.domain} — trusted retailer`, severity: 0 },
      { name: "Community Sentiment", status: "passed", detail: "Established retailer", severity: 0 },
      { name: "Safety Database", status: "passed", detail: "Trusted domain", severity: 0 },
      { name: "Link Verification", status: "passed", detail: "Trusted domain", severity: 0 },
    ];
  }

  // Brand impersonation is deterministic — run first
  const brandCheck = brandImpersonationCheck(product.domain);

  // URL reachability is now checked earlier in the pipeline (serpSearch.filterReachableProducts)
  // so we skip it here to avoid redundant network calls.
  const [price, domain, community, safety] = await Promise.all([
    Promise.resolve(priceAnomalyCheck(product, referencePrice)),
    semanticDomainCheck(product.domain, product.title),
    communityReputationCheck(product.url),
    safetyDatabaseCheck(product.url),
  ]);

  return [price, brandCheck, domain, community, safety];
}

// ── Verdict ────────────────────────────────────────────────────────────────────

/**
 * Fatal flags: certain conditions immediately force the trust score to 0 or 5,
 * bypassing the normal additive scoring. First match wins.
 *
 *   • Known malware/phishing (Safety Database failed)         → score 0
 *   • Implausible seller domain (Retailer Reputation failed)  → score 5
 *   • Scam price + suspicious domain (both checks failed)     → score 0
 */
const FATAL_FLAGS: Array<{
  label: string;
  test: (checks: FraudCheck[]) => boolean;
  score: number;
}> = [
  {
    label: "Known malware or phishing site",
    test: (cs) => cs.some((c) => c.name === "Safety Database" && c.status === "failed"),
    score: 0,
  },
  {
    label: "Brand impersonation — domain mimics a known brand",
    test: (cs) => cs.some((c) => c.name === "Brand Impersonation" && c.status === "failed"),
    score: 5,
  },
  {
    label: "Extreme price anomaly on implausible domain",
    test: (cs) =>
      cs.some((c) => c.name === "Page Red Flags"       && c.status === "failed") &&
      cs.some((c) => c.name === "Retailer Reputation"  && c.status === "failed"),
    score: 0,
  },
  {
    label: "Domain is not a logical seller for this product",
    test: (cs) =>
      cs.some((c) => c.name === "Retailer Reputation" && c.status === "failed" && c.severity >= 0.85),
    score: 5,
  },
];

/**
 * Computes a trust score (0–100) and a verdict from a set of FraudChecks.
 *
 * Fatal flags are checked first — any match immediately returns score 0 or 5
 * with verdict "danger", ignoring all other checks.
 *
 * Normal scoring (no fatal flag):
 *   failed  → severity × 40 points deducted
 *   warning → severity × 15 points deducted
 *
 * Verdict thresholds:
 *   ≥ 70 → "trusted"
 *   ≥ 40 → "caution"
 *    < 40 → "danger"
 */
export function computeVerdict(checks: FraudCheck[]): {
  verdict: ProductVerdict;
  trustScore: number;
  fatalFlag?: string;
} {
  // ── Fatal flag pre-pass ───────────────────────────────────────────────────
  for (const { label, test, score } of FATAL_FLAGS) {
    if (test(checks)) {
      return { verdict: "danger", trustScore: score, fatalFlag: label };
    }
  }

  // ── Normal additive scoring ───────────────────────────────────────────────
  let deduction = 0;
  for (const check of checks) {
    if (check.status === "failed")  deduction += check.severity * 40;
    if (check.status === "warning") deduction += check.severity * 15;
  }

  const trustScore = Math.round(Math.max(0, Math.min(100, 100 - deduction)));
  const verdict: ProductVerdict =
    trustScore >= 70 ? "trusted" : trustScore >= 40 ? "caution" : "danger";

  return { verdict, trustScore };
}
