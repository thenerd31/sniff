import { v4 as uuidv4 } from "uuid";
import type { EvidenceCard } from "@/types";

// ── Step 1: Perplexity finds product URLs across retailers ──────────────
// Perplexity is good at finding URLs, bad at knowing exact prices.
// We use it ONLY to discover retailer links, then scrape each one.

interface RetailerLink {
  retailer: string;
  url: string;
}

export async function findRetailerLinks(
  productUrl: string,
  productName?: string,
): Promise<RetailerLink[]> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) return [];

  // Truncate product name to key identifying info (first ~60 chars or first comma)
  const shortName = productName
    ? productName.split(",")[0].slice(0, 80).trim()
    : "";

  const searchQuery = shortName
    ? `Find where to buy "${shortName}" online. Original listing: ${productUrl}`
    : `Find direct product page URLs for the same product across different retailers: ${productUrl}`;

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          {
            role: "system",
            content: `You are a shopping assistant. Given a product, find links to buy it on major US retailers.

Return a JSON array of objects: [{"retailer": "Store Name", "url": "https://..."}]

Include retailers like: Amazon, Walmart, Best Buy, Target, eBay, Costco, B&H Photo, Apple Store, Newegg.
Return direct product page URLs (not search pages). Return 3-5 results.
Do NOT include the retailer from the original URL.`,
          },
          {
            role: "user",
            content: searchQuery,
          },
        ],
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (!response.ok) {
      console.error(`findRetailerLinks: Perplexity returned ${response.status}`);
      return [];
    }

    const data = await response.json();
    const content: string = data.choices?.[0]?.message?.content || "[]";
    console.log("findRetailerLinks raw response:", content.slice(0, 500));

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log("findRetailerLinks: no JSON array found in response");
      return [];
    }

    const links: RetailerLink[] = JSON.parse(jsonMatch[0]);
    const filtered = links.filter((l) => l.url && l.retailer && l.url.startsWith("http"));
    console.log(`findRetailerLinks: found ${filtered.length} links:`, filtered.map((l) => `${l.retailer}: ${l.url}`));
    return filtered;
  } catch (error) {
    console.error("findRetailerLinks failed:", error);
    return [];
  }
}

// ── Legacy: full price search (used as fallback) ────────────────────────
export async function priceSearch(productUrl: string): Promise<EvidenceCard[]> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) return [];

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          {
            role: "system",
            content: `You are a price comparison assistant. Given a product URL, find the CURRENT price of the same product on major retailers.

Return ONLY a JSON array with: retailer, price (number, USD), currency ("USD"), url (direct product link), inStock (boolean).
Return at most 5 results. Return [] if nothing found.`,
          },
          {
            role: "user",
            content: `Find prices for the product at this URL across retailers: ${productUrl}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) throw new Error(`Perplexity returned ${response.status}`);

    const data = await response.json();
    const content: string = data.choices?.[0]?.message?.content || "[]";
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const prices = JSON.parse(jsonMatch[0]);
    return prices
      .filter((p: { price: number }) => typeof p.price === "number" && p.price > 0)
      .map((p: { retailer: string; price: number; currency: string; url: string; inStock: boolean }) => ({
        id: uuidv4(),
        type: "price" as const,
        severity: "info" as const,
        title: `${p.retailer}: $${p.price.toFixed(2)}`,
        detail: `${p.inStock ? "In stock" : "Out of stock"} at ${p.retailer}`,
        source: "Perplexity Sonar",
        confidence: 0.5, // Low confidence — LLM-guessed prices
        connections: [],
        metadata: {
          retailer: p.retailer,
          price: p.price,
          currency: p.currency || "USD",
          url: p.url,
          inStock: p.inStock,
          verified: false,
        },
      }));
  } catch {
    return [];
  }
}
