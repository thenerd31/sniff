import type { FraudCheck, FraudCheckName, ProductVerdict, ProductResult } from "@/types";
import { isHighAuthorityDomain } from "@/lib/known-domains";
import { whoisLookup } from "./whois";
import { safeBrowsingCheck } from "./safe-browsing";
import { redditSearch } from "./reddit";
import { sellerCheck } from "./seller-check";

// ── Fraud Check Orchestrator ────────────────────────────────────────────
// Runs 4 independent fraud checks on a product result.
// Each check streams its result via the onCheck callback.
// Returns a final verdict and trust score.
//
// IMPORTANT: Checks must use product.domain (the retailer's domain),
// NOT product.url (which may be a Google Shopping redirect URL).

type OnCheckCallback = (productId: string, check: FraudCheck) => void;

/** Build a simple URL from the retailer domain for tools that need a URL. */
function domainToUrl(domain: string): string {
  return `https://${domain}`;
}

/**
 * Run all 4 fraud checks on a product in parallel.
 * Streams individual check results via onCheck callback.
 * Also checks for price anomalies against the cohort.
 */
export async function runFraudChecks(
  product: ProductResult,
  onCheck: OnCheckCallback,
  allProducts?: ProductResult[], // pass all products for price anomaly detection
): Promise<{ verdict: ProductVerdict; trustScore: number; checks: FraudCheck[] }> {
  const checks: FraudCheck[] = [];

  // ── Instant path: known high-authority domains ─────────────────────
  if (isHighAuthorityDomain(product.domain)) {
    const instantChecks: FraudCheck[] = [
      {
        name: "Retailer Reputation",
        status: "passed",
        detail: `${product.retailer} is a verified major retailer`,
        severity: 0,
      },
      {
        name: "Safety Database",
        status: "passed",
        detail: "Trusted domain — no lookup needed",
        severity: 0,
      },
      {
        name: "Community Sentiment",
        status: "passed",
        detail: "Well-known retailer with established reputation",
        severity: 0,
      },
      {
        name: "Seller Verification",
        status: "passed",
        detail: "Verified marketplace",
        severity: 0,
      },
    ];

    for (const check of instantChecks) {
      onCheck(product.id, check);
      checks.push(check);
    }

    return { verdict: "trusted", trustScore: 100, checks };
  }

  // ── Full check: run all 4 in parallel ─────────────────────────────
  const checkFunctions: Array<{
    name: FraudCheckName;
    fn: () => Promise<FraudCheck>;
  }> = [
    {
      name: "Retailer Reputation",
      fn: () => checkRetailerReputation(product),
    },
    {
      name: "Safety Database",
      fn: () => checkSafeBrowsing(product),
    },
    {
      name: "Community Sentiment",
      fn: () => checkCommunitySentiment(product),
    },
    {
      name: "Seller Verification",
      fn: () => checkSellerVerification(product),
    },
  ];

  await Promise.allSettled(
    checkFunctions.map(async ({ name, fn }) => {
      try {
        const check = await fn();
        checks.push(check);
        onCheck(product.id, check);
      } catch (error) {
        const fallbackCheck: FraudCheck = {
          name,
          status: "warning",
          detail: `Check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          severity: 0.3,
        };
        checks.push(fallbackCheck);
        onCheck(product.id, fallbackCheck);
      }
    })
  );

  // ── Price anomaly detection ───────────────────────────────────────
  // Low price ALONE is not a red flag — resale platforms legitimately sell cheaper.
  // Price only matters when COMBINED with other red flags (no Reddit, hidden WHOIS).
  // Logic: price amplifies existing suspicion, it doesn't create it.
  if (allProducts && allProducts.length >= 3 && !isHighAuthorityDomain(product.domain)) {
    const trustedPrices = allProducts
      .filter((p) => p.price > 0 && isHighAuthorityDomain(p.domain))
      .map((p) => p.price)
      .sort((a, b) => a - b);

    if (trustedPrices.length >= 1) {
      const retailPrice = trustedPrices[trustedPrices.length - 1];
      const pctBelow = ((retailPrice - product.price) / retailPrice) * 100;

      // Count how many OTHER checks already flagged this site
      const otherRedFlags = checks.filter(
        (c) => c.name !== "Retailer Reputation" && (c.status === "failed" || (c.status === "warning" && c.severity >= 0.5))
      ).length;

      if (pctBelow >= 50 && otherRedFlags >= 1) {
        // Cheap price + at least one other red flag = scam pattern
        const priceCheck: FraudCheck = {
          name: "Retailer Reputation",
          status: "failed",
          detail: `Price $${product.price.toFixed(2)} is ${Math.round(pctBelow)}% below retail ($${retailPrice.toFixed(2)}) — too good to be true on an unverified site`,
          severity: 0.95,
        };
        const repIdx = checks.findIndex((c) => c.name === "Retailer Reputation");
        if (repIdx >= 0) {
          const original = checks[repIdx];
          checks[repIdx] = {
            ...priceCheck,
            detail: `${priceCheck.detail}. ${original.detail}`,
          };
        } else {
          checks.push(priceCheck);
        }
        onCheck(product.id, priceCheck);
      } else if (pctBelow >= 50 && otherRedFlags === 0) {
        // Cheap but site otherwise looks fine — just note it, don't penalize
        const priceNote: FraudCheck = {
          name: "Retailer Reputation",
          status: "warning",
          detail: `Price $${product.price.toFixed(2)} is ${Math.round(pctBelow)}% below retail ($${retailPrice.toFixed(2)}) — could be used/refurbished`,
          severity: 0.2, // mild — site passed other checks
        };
        const repIdx = checks.findIndex((c) => c.name === "Retailer Reputation");
        if (repIdx >= 0) {
          // Don't override if existing check is already worse
          if (priceNote.severity > checks[repIdx].severity) {
            const original = checks[repIdx];
            checks[repIdx] = { ...priceNote, detail: `${priceNote.detail}. ${original.detail}` };
          }
        }
        onCheck(product.id, priceNote);
      }
    }
  }

  // ── Compute verdict ─────────────────────────────────────────────────
  // Use the worst severity per check name
  const checksByName = new Map<FraudCheckName, FraudCheck>();
  for (const check of checks) {
    const existing = checksByName.get(check.name);
    if (!existing || check.severity > existing.severity) {
      checksByName.set(check.name, check);
    }
  }

  // Rebalanced weights:
  // - Safe Browsing is binary (passes for 99% of sites), so low weight
  // - Retailer Reputation (WHOIS + price) is the strongest signal
  // - Community Sentiment matters a lot (zero presence = suspicious)
  const weights: Record<FraudCheckName, number> = {
    "Retailer Reputation": 0.35,
    "Safety Database": 0.10,
    "Community Sentiment": 0.30,
    "Seller Verification": 0.25,
  };

  let weightedScore = 0;
  for (const [name, check] of checksByName) {
    weightedScore += (1 - check.severity) * (weights[name] || 0.25);
  }
  const trustScore = Math.round(weightedScore * 100);

  // Count how many checks failed or warned
  const failedCount = [...checksByName.values()].filter((c) => c.status === "failed").length;
  const warningCount = [...checksByName.values()].filter((c) => c.status === "warning").length;

  let verdict: ProductVerdict;
  if (failedCount >= 1 && [...checksByName.values()].some((c) => c.severity >= 0.8)) {
    verdict = "danger";
  } else if (failedCount >= 2) {
    verdict = "danger";
  } else if (trustScore >= 75) {
    verdict = "trusted";
  } else if (trustScore >= 45) {
    verdict = "caution";
  } else {
    verdict = "danger";
  }

  return { verdict, trustScore, checks: [...checksByName.values()] };
}

// ── Check 1: Retailer Reputation (WHOIS + domain analysis) ─────────────
// Uses product.domain (NOT product.url) for WHOIS lookup.

async function checkRetailerReputation(product: ProductResult): Promise<FraudCheck> {
  const SUSPICIOUS_TLDS = /\.(shop|buzz|xyz|top|click|gq|ml|tk|cf|ga|pw|cc|ws)$/i;

  // Quick TLD check
  if (SUSPICIOUS_TLDS.test(product.domain)) {
    return {
      name: "Retailer Reputation",
      status: "failed",
      detail: `Suspicious domain TLD: ${product.domain}`,
      severity: 0.8,
    };
  }

  // WHOIS check for domain age — use the RETAILER domain, not Google
  try {
    const retailerUrl = domainToUrl(product.domain);
    const whoisCard = await whoisLookup(retailerUrl);

    if (whoisCard.severity === "critical") {
      return {
        name: "Retailer Reputation",
        status: "failed",
        detail: `${product.domain}: ${whoisCard.title} — ${whoisCard.detail}`,
        severity: 0.9,
      };
    }

    if (whoisCard.severity === "warning") {
      return {
        name: "Retailer Reputation",
        status: "warning",
        detail: `${product.domain}: ${whoisCard.title} — ${whoisCard.detail}`,
        severity: 0.5,
      };
    }

    return {
      name: "Retailer Reputation",
      status: "passed",
      detail: `${product.domain}: ${whoisCard.title} — ${whoisCard.detail}`,
      severity: 0.1,
    };
  } catch {
    return {
      name: "Retailer Reputation",
      status: "warning",
      detail: `Could not verify domain registration for ${product.domain}`,
      severity: 0.4,
    };
  }
}

// ── Check 2: Safety Database (Google Safe Browsing) ─────────────────────
// Checks the RETAILER domain against Google's threat database.

async function checkSafeBrowsing(product: ProductResult): Promise<FraudCheck> {
  try {
    const retailerUrl = domainToUrl(product.domain);
    const sbCard = await safeBrowsingCheck(retailerUrl);

    if (sbCard.severity === "critical") {
      return {
        name: "Safety Database",
        status: "failed",
        detail: sbCard.detail,
        severity: 1.0,
      };
    }

    return {
      name: "Safety Database",
      status: "passed",
      detail: `${product.domain}: ${sbCard.detail}`,
      severity: 0,
    };
  } catch {
    return {
      name: "Safety Database",
      status: "warning",
      detail: "Could not check safety database",
      severity: 0.2,
    };
  }
}

// ── Check 3: Community Sentiment (Reddit) ───────────────────────────────
// Searches Reddit for the RETAILER domain (not Google URL).

async function checkCommunitySentiment(product: ProductResult): Promise<FraudCheck> {
  try {
    const retailerUrl = domainToUrl(product.domain);
    const redditCard = await redditSearch(retailerUrl);

    if (redditCard.severity === "critical") {
      return {
        name: "Community Sentiment",
        status: "failed",
        detail: redditCard.title + " — " + redditCard.detail,
        severity: 0.9,
      };
    }

    if (redditCard.severity === "warning") {
      return {
        name: "Community Sentiment",
        status: "warning",
        detail: redditCard.title + " — " + redditCard.detail,
        severity: 0.5,
      };
    }

    if (redditCard.severity === "info" && redditCard.metadata?.postCount === 0) {
      return {
        name: "Community Sentiment",
        status: "warning",
        detail: `No Reddit mentions found for ${product.domain} — zero online presence is a red flag`,
        severity: 0.7,
      };
    }

    return {
      name: "Community Sentiment",
      status: "passed",
      detail: redditCard.title + " — " + redditCard.detail,
      severity: 0.1,
    };
  } catch {
    return {
      name: "Community Sentiment",
      status: "warning",
      detail: `Could not check community sentiment for ${product.domain}`,
      severity: 0.3,
    };
  }
}

// ── Check 4: Seller / Review Verification (Yifan's seller-check) ────────
// For known marketplaces, checks seller within the platform.
// For direct retailers, analyzes page content and reviews.
// Uses the RETAILER domain URL.

async function checkSellerVerification(product: ProductResult): Promise<FraudCheck> {
  try {
    const retailerUrl = domainToUrl(product.domain);
    const sellerCard = await sellerCheck(retailerUrl);

    if (sellerCard.severity === "critical") {
      return {
        name: "Seller Verification",
        status: "failed",
        detail: sellerCard.title + " — " + sellerCard.detail,
        severity: 0.8,
      };
    }

    if (sellerCard.severity === "warning") {
      return {
        name: "Seller Verification",
        status: "warning",
        detail: sellerCard.title + " — " + sellerCard.detail,
        severity: 0.5,
      };
    }

    if (sellerCard.severity === "info") {
      return {
        name: "Seller Verification",
        status: "warning",
        detail: sellerCard.title + " — " + sellerCard.detail,
        severity: 0.3,
      };
    }

    return {
      name: "Seller Verification",
      status: "passed",
      detail: sellerCard.title + " — " + sellerCard.detail,
      severity: 0.05,
    };
  } catch {
    return {
      name: "Seller Verification",
      status: "warning",
      detail: `Could not verify seller at ${product.domain}`,
      severity: 0.3,
    };
  }
}
