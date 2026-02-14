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

type OnCheckCallback = (productId: string, check: FraudCheck) => void;

/**
 * Run all 4 fraud checks on a product in parallel.
 * Streams individual check results via onCheck callback.
 */
export async function runFraudChecks(
  product: ProductResult,
  onCheck: OnCheckCallback,
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

  // ── Compute verdict ─────────────────────────────────────────────────
  const weights: Record<FraudCheckName, number> = {
    "Retailer Reputation": 0.30,
    "Safety Database": 0.30,
    "Community Sentiment": 0.20,
    "Seller Verification": 0.20,
  };

  let weightedScore = 0;
  for (const check of checks) {
    weightedScore += (1 - check.severity) * (weights[check.name] || 0.25);
  }
  const trustScore = Math.round(weightedScore * 100);

  let verdict: ProductVerdict;
  if (checks.some((c) => c.status === "failed" && c.severity >= 0.8)) {
    verdict = "danger";
  } else if (trustScore >= 70) {
    verdict = "trusted";
  } else if (trustScore >= 40) {
    verdict = "caution";
  } else {
    verdict = "danger";
  }

  return { verdict, trustScore, checks };
}

// ── Check 1: Retailer Reputation (WHOIS + domain analysis) ─────────────

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

  // WHOIS check for domain age
  try {
    const whoisCard = await whoisLookup(product.url);

    if (whoisCard.severity === "critical") {
      return {
        name: "Retailer Reputation",
        status: "failed",
        detail: whoisCard.title + " — " + whoisCard.detail,
        severity: 0.9,
      };
    }

    if (whoisCard.severity === "warning") {
      return {
        name: "Retailer Reputation",
        status: "warning",
        detail: whoisCard.title + " — " + whoisCard.detail,
        severity: 0.5,
      };
    }

    return {
      name: "Retailer Reputation",
      status: "passed",
      detail: whoisCard.title + " — " + whoisCard.detail,
      severity: 0.1,
    };
  } catch {
    return {
      name: "Retailer Reputation",
      status: "warning",
      detail: "Could not verify domain registration",
      severity: 0.4,
    };
  }
}

// ── Check 2: Safety Database (Google Safe Browsing) ─────────────────────

async function checkSafeBrowsing(product: ProductResult): Promise<FraudCheck> {
  try {
    const sbCard = await safeBrowsingCheck(product.url);

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
      detail: sbCard.detail,
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
    const redditCard = await redditSearch(product.url);

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
        detail: "No online presence found — retailer has no Reddit mentions",
        severity: 0.3,
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
      detail: "Could not check community sentiment",
      severity: 0.3,
    };
  }
}

// ── Check 4: Seller / Review Verification (Yifan's seller-check) ────────

async function checkSellerVerification(product: ProductResult): Promise<FraudCheck> {
  try {
    const sellerCard = await sellerCheck(product.url);

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
      detail: "Could not verify seller page",
      severity: 0.3,
    };
  }
}
