import type { FraudCheck, FraudCheckName, ProductVerdict, ProductResult } from "@/types";
import { isHighAuthorityDomain } from "@/lib/known-domains";
import { whoisLookup } from "./whois";
import { safeBrowsingCheck } from "./safe-browsing";
import { redditSearch } from "./reddit";
import { brandImpersonationCheck } from "./brand-impersonation";
import { scrapeForRedFlags } from "./scraper";

// ── Fraud Check Orchestrator ────────────────────────────────────────────
// Runs 5 independent fraud checks on a product result.
// Each check streams its result via the onCheck callback.
// Returns a final verdict and trust score.
//
// Checks:
//   1. Retailer Reputation — WHOIS domain age + suspicious TLD
//   2. Safety Database     — Google Safe Browsing
//   3. Community Sentiment — Reddit search + LLM sentiment
//   4. Brand Impersonation — typosquatting / lookalike domain detection
//   5. Page Red Flags      — urgency tactics, missing policies, suspicious payments
//
// IMPORTANT: Checks must use product.domain (the retailer's domain),
// NOT product.url (which may be a Google Shopping redirect URL).

type OnCheckCallback = (productId: string, check: FraudCheck) => void;

/** Build a simple URL from the retailer domain for tools that need a URL. */
function domainToUrl(domain: string): string {
  return `https://${domain}`;
}

/**
 * Run all 5 fraud checks on a product in parallel.
 * Streams individual check results via onCheck callback.
 * Also checks for price anomalies against the cohort.
 */
export async function runFraudChecks(
  product: ProductResult,
  onCheck: OnCheckCallback,
  allProducts?: ProductResult[],
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
        name: "Brand Impersonation",
        status: "passed",
        detail: "Official domain — not an impersonator",
        severity: 0,
      },
      {
        name: "Page Red Flags",
        status: "passed",
        detail: "Trusted retailer — no scan needed",
        severity: 0,
      },
    ];

    for (const check of instantChecks) {
      onCheck(product.id, check);
      checks.push(check);
    }

    return { verdict: "trusted", trustScore: 100, checks };
  }

  // ── Full check: run all 5 in parallel ─────────────────────────────
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
      name: "Brand Impersonation",
      fn: () => checkBrandImpersonation(product),
    },
    {
      name: "Page Red Flags",
      fn: () => checkPageRedFlags(product),
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
        const priceNote: FraudCheck = {
          name: "Retailer Reputation",
          status: "warning",
          detail: `Price $${product.price.toFixed(2)} is ${Math.round(pctBelow)}% below retail ($${retailPrice.toFixed(2)}) — could be used/refurbished`,
          severity: 0.2,
        };
        const repIdx = checks.findIndex((c) => c.name === "Retailer Reputation");
        if (repIdx >= 0) {
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
  const checksByName = new Map<FraudCheckName, FraudCheck>();
  for (const check of checks) {
    const existing = checksByName.get(check.name);
    if (!existing || check.severity > existing.severity) {
      checksByName.set(check.name, check);
    }
  }

  // Weights: rebalanced so noisy signals don't dominate
  const weights: Record<FraudCheckName, number> = {
    "Retailer Reputation": 0.25,  // WHOIS + price anomaly
    "Safety Database": 0.15,      // binary but critical when it fires
    "Community Sentiment": 0.15,  // Reddit presence — low weight, many legit sites absent
    "Brand Impersonation": 0.20,  // catches typosquatting
    "Page Red Flags": 0.25,       // urgency, missing policies, suspicious payments
    "Seller Verification": 0.15,  // seller page analysis
    "Link Verification": 0.10,   // dead links = bad data
  };

  let weightedScore = 0;
  let totalWeight = 0;
  for (const [name, check] of checksByName) {
    const w = weights[name] || 0.15;
    weightedScore += (1 - check.severity) * w;
    totalWeight += w;
  }
  // Normalize so score is always 0-100 regardless of how many checks ran
  const trustScore = totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 50;

  const failedChecks = [...checksByName.values()].filter((c) => c.status === "failed");
  const failedCount = failedChecks.length;

  let verdict: ProductVerdict;
  // Only "danger" if there are multiple hard failures OR a truly critical signal (safety DB)
  if (failedChecks.some((c) => c.name === "Safety Database" && c.severity >= 0.8)) {
    verdict = "danger";
  } else if (failedCount >= 2 && failedChecks.some((c) => c.severity >= 0.7)) {
    verdict = "danger";
  } else if (trustScore >= 70) {
    verdict = "trusted";
  } else if (trustScore >= 40) {
    verdict = "caution";
  } else {
    verdict = "danger";
  }

  return { verdict, trustScore, checks: [...checksByName.values()] };
}

// ── Check 1: Retailer Reputation (WHOIS + domain analysis) ─────────────

async function checkRetailerReputation(product: ProductResult): Promise<FraudCheck> {
  const SUSPICIOUS_TLDS = /\.(shop|buzz|xyz|top|click|gq|ml|tk|cf|ga|pw|cc|ws)$/i;

  if (SUSPICIOUS_TLDS.test(product.domain)) {
    return {
      name: "Retailer Reputation",
      status: "failed",
      detail: `Suspicious domain TLD: ${product.domain}`,
      severity: 0.8,
    };
  }

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
      severity: 0,
    };
  } catch {
    return {
      name: "Retailer Reputation",
      status: "warning",
      detail: `Could not verify domain registration for ${product.domain}`,
      severity: 0.2,
    };
  }
}

// ── Check 2: Safety Database (Google Safe Browsing) ─────────────────────

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
        detail: `No Reddit mentions found for ${product.domain} — limited online presence`,
        severity: 0.15, // Low severity: many legit retailers have no Reddit presence
      };
    }

    return {
      name: "Community Sentiment",
      status: "passed",
      detail: redditCard.title + " — " + redditCard.detail,
      severity: 0,
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

// ── Check 4: Brand Impersonation (typosquatting detection) ──────────────

async function checkBrandImpersonation(product: ProductResult): Promise<FraudCheck> {
  try {
    const retailerUrl = domainToUrl(product.domain);
    const card = await brandImpersonationCheck(retailerUrl);

    if (card.severity === "critical") {
      return {
        name: "Brand Impersonation",
        status: "failed",
        detail: `${product.domain}: ${card.title} — ${card.detail}`,
        severity: 0.95,
      };
    }

    return {
      name: "Brand Impersonation",
      status: "passed",
      detail: `${product.domain}: ${card.detail}`,
      severity: 0,
    };
  } catch {
    return {
      name: "Brand Impersonation",
      status: "warning",
      detail: `Could not check brand impersonation for ${product.domain}`,
      severity: 0.2,
    };
  }
}

// ── Check 5: Page Red Flags (urgency, missing policies, payments) ───────

async function checkPageRedFlags(product: ProductResult): Promise<FraudCheck> {
  try {
    const retailerUrl = domainToUrl(product.domain);
    const cards = await scrapeForRedFlags(retailerUrl, product.title);

    // Find the worst red flag
    const critical = cards.find((c) => c.severity === "critical");
    if (critical) {
      return {
        name: "Page Red Flags",
        status: "failed",
        detail: `${product.domain}: ${critical.title} — ${critical.detail}`,
        severity: 0.85,
      };
    }

    const warnings = cards.filter((c) => c.severity === "warning");
    if (warnings.length >= 2) {
      const details = warnings.map((w) => w.title).join("; ");
      return {
        name: "Page Red Flags",
        status: "failed",
        detail: `${product.domain}: Multiple red flags — ${details}`,
        severity: 0.7,
      };
    }

    if (warnings.length === 1) {
      return {
        name: "Page Red Flags",
        status: "warning",
        detail: `${product.domain}: ${warnings[0].title} — ${warnings[0].detail}`,
        severity: 0.4,
      };
    }

    return {
      name: "Page Red Flags",
      status: "passed",
      detail: `${product.domain}: No scam indicators found on page`,
      severity: 0,
    };
  } catch {
    return {
      name: "Page Red Flags",
      status: "warning",
      detail: `Could not scan page for ${product.domain}`,
      severity: 0.2,
    };
  }
}
