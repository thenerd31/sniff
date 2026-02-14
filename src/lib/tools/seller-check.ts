// src/lib/tools/seller-check.ts
// Seller & review verification — fetches pages via Bright Data Web Unlocker
// (bypasses CAPTCHAs / bot protection) then analyzes with an LLM.
// Falls back to plain fetch if BRIGHT_DATA_API_KEY is not set.
//
// Env vars:
//   BRIGHT_DATA_API_KEY  — same key used by serpSearch.ts
//   BRIGHT_DATA_UNLOCKER_ZONE  — defaults to "web_unlocker1"

import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";
import type { EvidenceCard, CardSeverity } from "@/types";

// ── Bright Data Web Unlocker ──────────────────────────────────────────────────
const BD_API_KEY = process.env.BRIGHT_DATA_API_KEY ?? "";
const BD_UNLOCKER_ZONE = process.env.BRIGHT_DATA_UNLOCKER_ZONE ?? "web_unlocker1";

// ── Types ─────────────────────────────────────────────────────────────────────
interface SellerAnalysis {
  isMarketplace: boolean;
  marketplace: string | null;
  sellerName: string | null;
  sellerRating: number | null;            // 0–5
  reviewCount: number | null;
  memberSinceMonths: number | null;
  reviewAuthenticityScore: number | null; // 0–10
  reviewAuthenticityReason: string | null;
}

// ── Marketplace detection ─────────────────────────────────────────────────────
const MARKETPLACE_FRAGMENTS: Record<string, string> = {
  amazon: "amazon.",
  ebay: "ebay.",
  etsy: "etsy.com",
};

function detectMarketplace(hostname: string): string | null {
  for (const [name, fragment] of Object.entries(MARKETPLACE_FRAGMENTS)) {
    if (hostname.includes(fragment)) return name;
  }
  return null;
}

// ── Page text extraction ──────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 12_000);
}

/**
 * Fetch page HTML via Bright Data Web Unlocker — handles CAPTCHAs, JS
 * rendering, and bot-protection automatically. Returns stripped plain text.
 */
async function fetchWithUnlocker(url: string): Promise<string> {
  const res = await fetch("https://api.brightdata.com/request", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${BD_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      zone: BD_UNLOCKER_ZONE,
      url,
      format: "raw",
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    throw new Error(`Bright Data Web Unlocker HTTP ${res.status}`);
  }

  const html = await res.text();
  return stripHtml(html);
}

/**
 * Plain-fetch fallback — used when BRIGHT_DATA_API_KEY is not set.
 */
async function fetchPlain(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  return stripHtml(await res.text());
}

async function fetchPageText(url: string): Promise<string> {
  if (BD_API_KEY) {
    return fetchWithUnlocker(url);
  }
  return fetchPlain(url);
}

// ── LLM analysis ──────────────────────────────────────────────────────────────

async function analyzeWithLLM(
  url: string,
  pageText: string,
  marketplace: string | null
): Promise<SellerAnalysis> {
  const openai = new OpenAI();

  const { choices } = await openai.chat.completions.create({
    model: "gpt-5-mini",
    temperature: 1,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You extract seller and review credibility data from e-commerce page text.

From the page content, extract:
- sellerName: the third-party seller's name (null if the platform itself is the seller, or not found)
- sellerRating: seller rating as a 0–5 float. Convert percentage-positive feedback: "98% positive" → 4.9. null if not found.
- reviewCount: total seller ratings / feedback score count (null if not found)
- memberSinceMonths: how long the seller has been a member, in months (null if not found)

Then find up to 10 review text snippets visible on the page and assess their authenticity:
- reviewAuthenticityScore: 0–10 (0 = clearly fake, 10 = clearly authentic; null if no reviews found)
- reviewAuthenticityReason: one sentence explaining your score (null if no reviews)

Fake review signals: all reviews posted same day/week, identical generic phrasing ("great product!", "fast shipping!"), no product specifics, suspiciously short reviews, only 5-star ratings.

Respond ONLY with this JSON:
{
  "sellerName": string | null,
  "sellerRating": number | null,
  "reviewCount": number | null,
  "memberSinceMonths": number | null,
  "reviewAuthenticityScore": number | null,
  "reviewAuthenticityReason": string | null
}`,
      },
      {
        role: "user",
        content: `Platform: ${marketplace ?? "direct retailer"}\nURL: ${url}\n\n${pageText}`,
      },
    ],
  });

  const raw = JSON.parse(choices[0]?.message?.content ?? "{}");
  return {
    isMarketplace: marketplace !== null,
    marketplace,
    sellerName: typeof raw.sellerName === "string" ? raw.sellerName : null,
    sellerRating: typeof raw.sellerRating === "number" ? raw.sellerRating : null,
    reviewCount: typeof raw.reviewCount === "number" ? raw.reviewCount : null,
    memberSinceMonths:
      typeof raw.memberSinceMonths === "number" ? raw.memberSinceMonths : null,
    reviewAuthenticityScore:
      typeof raw.reviewAuthenticityScore === "number"
        ? raw.reviewAuthenticityScore
        : null,
    reviewAuthenticityReason:
      typeof raw.reviewAuthenticityReason === "string"
        ? raw.reviewAuthenticityReason
        : null,
  };
}

// ── Card builder ──────────────────────────────────────────────────────────────

function buildCard(data: SellerAnalysis, usedBrowser: boolean): EvidenceCard {
  const issues: string[] = [];
  let severity: CardSeverity = "safe";

  if (data.memberSinceMonths !== null && data.memberSinceMonths < 3) {
    issues.push(`account only ${data.memberSinceMonths}mo old`);
    severity = "critical";
  }

  if (data.sellerRating !== null && data.sellerRating < 3.5) {
    issues.push(`low rating ${data.sellerRating.toFixed(1)}★`);
    if (severity !== "critical") severity = "warning";
  }

  if (data.reviewCount !== null && data.reviewCount < 10) {
    issues.push(`only ${data.reviewCount} review(s)`);
    if (severity !== "critical") severity = "warning";
  }

  if (
    data.reviewAuthenticityScore !== null &&
    data.reviewAuthenticityScore < 4
  ) {
    issues.push(
      `suspicious reviews (authenticity ${data.reviewAuthenticityScore}/10)`
    );
    severity = "critical";
  }

  const sourceLabel = usedBrowser
    ? "Seller Verification (Bright Data browser)"
    : "Seller Verification";

  // ── Sold directly by platform ────────────────────────────────────────────
  if (data.isMarketplace && !data.sellerName) {
    return {
      id: uuidv4(),
      type: "seller",
      severity: "safe",
      title: "Sold directly by platform",
      detail: `${data.marketplace} is the direct seller — no third-party seller to verify`,
      source: sourceLabel,
      confidence: 0.6,
      connections: [],
      metadata: { marketplace: data.marketplace, directSale: true, status: "passed" },
    };
  }

  // ── Build detail string ──────────────────────────────────────────────────
  let title: string;
  let detail: string;

  if (data.isMarketplace && data.sellerName) {
    const platform =
      data.marketplace![0].toUpperCase() + data.marketplace!.slice(1);
    const parts: string[] = [`${platform} seller '${data.sellerName}'`];
    if (data.sellerRating !== null)
      parts.push(`${data.sellerRating.toFixed(1)}★`);
    if (data.reviewCount !== null)
      parts.push(`${data.reviewCount.toLocaleString()} reviews`);
    if (data.memberSinceMonths !== null) {
      const years = Math.floor(data.memberSinceMonths / 12);
      parts.push(
        years > 0
          ? `selling since ${years}yr ago`
          : `selling since ${data.memberSinceMonths}mo ago`
      );
    }
    detail = parts.join(", ");
    if (issues.length > 0) detail += ` — ${issues.join("; ")}`;

    title =
      severity === "safe"
        ? `Seller verified: ${data.sellerName}`
        : severity === "critical"
        ? `Seller red flag: ${data.sellerName}`
        : `Seller warning: ${data.sellerName}`;
  } else {
    if (data.reviewAuthenticityScore !== null) {
      detail = `Review authenticity: ${data.reviewAuthenticityScore}/10 — ${data.reviewAuthenticityReason ?? ""}`;
      title =
        severity === "critical"
          ? "Suspicious reviews detected"
          : severity === "warning"
          ? "Review authenticity uncertain"
          : "Reviews appear authentic";
    } else {
      title = "Direct retailer — no seller data";
      detail =
        "No third-party marketplace seller to verify and no reviews found on page";
      severity = "info";
    }
  }

  const status =
    issues.length === 0
      ? "passed"
      : severity === "critical"
      ? "failed"
      : "warning";

  return {
    id: uuidv4(),
    type: "seller",
    severity,
    title,
    detail,
    source: sourceLabel,
    confidence: usedBrowser ? 0.9 : 0.75,
    connections: [],
    metadata: {
      marketplace: data.marketplace,
      sellerName: data.sellerName,
      sellerRating: data.sellerRating,
      reviewCount: data.reviewCount,
      memberSinceMonths: data.memberSinceMonths,
      reviewAuthenticityScore: data.reviewAuthenticityScore,
      status,
      fetchMethod: usedBrowser ? "brightdata-browser" : "plain-fetch",
    },
  };
}

// ── Public export ─────────────────────────────────────────────────────────────

export async function sellerCheck(url: string): Promise<EvidenceCard> {
  const hostname = new URL(url).hostname.replace(/^www\./, "");
  const marketplace = detectMarketplace(hostname);

  try {
    const pageText = await fetchPageText(url);
    const data = await analyzeWithLLM(url, pageText, marketplace);
    return buildCard(data, !!BD_API_KEY);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    const isBlocked = /403|forbidden|blocked|captcha/i.test(msg);

    return {
      id: uuidv4(),
      type: "seller",
      severity: "info",
      title: isBlocked
        ? "Seller page blocked automated access"
        : "Seller check failed",
      detail: isBlocked
        ? "The marketplace blocked scraping — try investigating from a browser directly"
        : `Could not analyze seller: ${msg}`,
      source: "Seller Verification",
      confidence: 0,
      connections: [],
      metadata: { marketplace, error: true },
    };
  }
}
