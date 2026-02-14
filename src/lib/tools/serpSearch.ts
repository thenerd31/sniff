import { v4 as uuidv4 } from "uuid";
import type { ProductResult } from "@/types";

// ── Bright Data SERP API — Google Shopping ──────────────────────────────
// Returns parsed JSON with: title, price, shop, rating, reviews_cnt, image
// Note: Full JSON format does NOT include product URLs.
// We construct search URLs from the shop name + product title.

interface BrightDataShoppingItem {
  title?: string;
  price?: string;       // "$249.99" format
  old_price?: string;
  shop?: string;         // "Amazon", "Walmart", "nacelexpert.com"
  rating?: number;
  reviews_cnt?: number;
  shipping?: string;
  tag?: string;          // "$10 OFF" etc.
  image?: string;        // base64 data URL
  image_url?: string;
  rank?: number;
}

// Map known retailer names to their domains
const RETAILER_DOMAINS: Record<string, string> = {
  "amazon": "amazon.com",
  "amazon.com": "amazon.com",
  "walmart": "walmart.com",
  "walmart.com": "walmart.com",
  "best buy": "bestbuy.com",
  "bestbuy": "bestbuy.com",
  "bestbuy.com": "bestbuy.com",
  "target": "target.com",
  "target.com": "target.com",
  "ebay": "ebay.com",
  "ebay.com": "ebay.com",
  "costco": "costco.com",
  "costco.com": "costco.com",
  "newegg": "newegg.com",
  "newegg.com": "newegg.com",
  "b&h photo": "bhphotovideo.com",
  "b&h": "bhphotovideo.com",
  "apple": "apple.com",
  "apple.com": "apple.com",
  "samsung": "samsung.com",
  "adorama": "adorama.com",
  "home depot": "homedepot.com",
  "lowe's": "lowes.com",
  "macy's": "macys.com",
  "nordstrom": "nordstrom.com",
  "wayfair": "wayfair.com",
  "etsy": "etsy.com",
  "nike": "nike.com",
  "nike.com": "nike.com",
  "adidas": "adidas.com",
};

function shopToDomain(shop: string): string {
  const normalized = shop.toLowerCase().trim();

  // Check our known retailer map (exact match)
  if (RETAILER_DOMAINS[normalized]) return RETAILER_DOMAINS[normalized];

  // Handle marketplace seller names like "Newegg.com - Quro", "Amazon.com - SellerName"
  // Extract the domain part before the separator
  const separatorMatch = normalized.match(/^([a-z0-9.-]+\.[a-z]{2,})\s*[-–—|]/);
  if (separatorMatch) {
    const baseDomain = separatorMatch[1];
    if (RETAILER_DOMAINS[baseDomain]) return RETAILER_DOMAINS[baseDomain];
    return baseDomain;
  }

  // Check if any known retailer name appears at the start
  for (const [key, domain] of Object.entries(RETAILER_DOMAINS)) {
    if (normalized.startsWith(key)) return domain;
  }

  // If the shop name looks like a domain already (has a dot), extract just the domain part
  if (normalized.includes(".")) {
    // Strip anything after a space/dash (e.g. "store.com - seller name" → "store.com")
    const domainPart = normalized.split(/\s+[-–—|]/)[0].trim();
    return domainPart;
  }

  // Otherwise, construct a best-guess domain
  return normalized.replace(/[^a-z0-9]/g, "") + ".com";
}

function shopToUrl(shop: string, productTitle: string): string {
  const domain = shopToDomain(shop);

  // For known retailers, construct search URLs
  const title = encodeURIComponent(productTitle);
  if (domain === "amazon.com") return `https://www.amazon.com/s?k=${title}`;
  if (domain === "walmart.com") return `https://www.walmart.com/search?q=${title}`;
  if (domain === "bestbuy.com") return `https://www.bestbuy.com/site/searchpage.jsp?st=${title}`;
  if (domain === "target.com") return `https://www.target.com/s?searchTerm=${title}`;
  if (domain === "ebay.com") return `https://www.ebay.com/sch/i.html?_nkw=${title}`;
  if (domain === "costco.com") return `https://www.costco.com/CatalogSearch?keyword=${title}`;
  if (domain === "newegg.com") return `https://www.newegg.com/p/pl?d=${title}`;

  // For unknown retailers, link to Google Shopping filtered by site
  return `https://www.google.com/search?q=${title}+site:${domain}&tbm=shop`;
}

/**
 * Parse a price string like "$249.99" or "$1,249.00" into a number.
 */
function parsePrice(priceStr: string): number {
  const match = priceStr.match(/([\d,]+\.?\d*)/);
  if (!match) return 0;
  return parseFloat(match[1].replace(/,/g, ""));
}

/**
 * Search Google Shopping via Bright Data SERP API.
 * Runs multiple queries in parallel and deduplicates results.
 */
export async function searchProducts(
  queries: string[],
  maxResults: number = 12,
): Promise<ProductResult[]> {
  // Try Bright Data SERP first
  const apiKey = process.env.BRIGHT_DATA_API_KEY;
  const zone = process.env.BRIGHT_DATA_SERP_ZONE;

  if (apiKey && zone) {
    const results = await searchViaBrightData(queries, apiKey, zone, maxResults);
    if (results.length > 0) return results;
    console.log("serpSearch: Bright Data returned no results, falling back to Perplexity");
  }

  // Fallback to Perplexity
  return searchProductsPerplexity(queries, maxResults);
}

async function searchViaBrightData(
  queries: string[],
  apiKey: string,
  zone: string,
  maxResults: number,
): Promise<ProductResult[]> {
  // Run all queries in parallel
  const allResults = await Promise.allSettled(
    queries.map((query) => searchGoogleShopping(query, apiKey, zone))
  );

  const products: ProductResult[] = [];
  const seen = new Set<string>();

  for (const result of allResults) {
    if (result.status === "fulfilled") {
      for (const product of result.value) {
        // Deduplicate by retailer + title prefix
        const key = `${product.domain}:${product.title.toLowerCase().slice(0, 40)}`;
        if (!seen.has(key)) {
          seen.add(key);
          products.push(product);
        }
      }
    }
  }

  return products.slice(0, maxResults);
}

async function searchGoogleShopping(
  query: string,
  apiKey: string,
  zone: string,
): Promise<ProductResult[]> {
  const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=shop&num=20&hl=en&gl=us`;

  try {
    const response = await fetch("https://api.brightdata.com/request", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ zone, url: googleUrl, format: "raw" }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.error(`serpSearch: Bright Data returned ${response.status}`);
      return [];
    }

    const data = await response.json();
    const items: BrightDataShoppingItem[] = data.shopping || [];

    if (!Array.isArray(items) || items.length === 0) {
      console.log("serpSearch: no shopping results, keys:", Object.keys(data));
      return [];
    }

    return items
      .filter((item) => item.title && item.price && item.shop)
      .map((item) => {
        const price = parsePrice(item.price!);
        const domain = shopToDomain(item.shop!);
        const url = shopToUrl(item.shop!, item.title!);

        // Clean up retailer name: "Newegg.com - Quro" → "Newegg"
        let retailer = item.shop!;
        const sepIdx = retailer.search(/\s*[-–—|]\s/);
        if (sepIdx > 0) retailer = retailer.substring(0, sepIdx).trim();
        // Remove .com suffix for display: "nacelexpert.com" → "nacelexpert.com" (keep for unknowns)

        return {
          id: uuidv4(),
          title: item.title!,
          price,
          currency: "USD",
          retailer,
          domain,
          url,
          imageUrl: item.image_url || undefined,
          rating: item.rating,
          reviewCount: item.reviews_cnt,
          snippet: [item.shipping, item.tag].filter(Boolean).join(" | ") || undefined,
        };
      })
      .filter((p) => p.price > 0);
  } catch (error) {
    console.error("serpSearch: Google Shopping search failed:", error);
    return [];
  }
}

// ── Perplexity Fallback ─────────────────────────────────────────────────

async function searchProductsPerplexity(
  queries: string[],
  maxResults: number,
): Promise<ProductResult[]> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) return [];

  const query = queries[0];

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
            content: `You are a product search engine. Find real products matching the user's query across major US retailers.

Return a JSON array of products:
[{
  "title": "Full product name",
  "price": 249.99,
  "retailer": "Amazon",
  "url": "https://www.amazon.com/dp/...",
  "rating": 4.5,
  "reviewCount": 1234,
  "snippet": "Brief description"
}]

Rules:
- Return 8-12 results from different retailers
- Include: Amazon, Walmart, Best Buy, Target, eBay, Costco, B&H Photo, Newegg, direct brand stores
- Prices must be current USD numbers (not strings)
- URLs must be real, direct product page links
- Include both exact matches and close alternatives
- Sort by relevance to the query`,
          },
          {
            role: "user",
            content: `Find products: ${query}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) return [];

    const data = await response.json();
    const content: string = data.choices?.[0]?.message?.content || "[]";
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const items = JSON.parse(jsonMatch[0]);
    return items
      .filter((p: Record<string, unknown>) =>
        typeof p.price === "number" && p.price > 0 && p.url
      )
      .slice(0, maxResults)
      .map((p: Record<string, unknown>) => {
        let domain = "";
        try {
          domain = new URL(p.url as string).hostname.replace(/^www\./, "");
        } catch {
          domain = (p.retailer as string) || "unknown";
        }
        return {
          id: uuidv4(),
          title: (p.title as string) || query,
          price: p.price as number,
          currency: "USD",
          retailer: (p.retailer as string) || domain,
          domain,
          url: p.url as string,
          rating: p.rating as number | undefined,
          reviewCount: p.reviewCount as number | undefined,
          snippet: p.snippet as string | undefined,
        };
      });
  } catch (error) {
    console.error("serpSearch (Perplexity fallback) failed:", error);
    return [];
  }
}
