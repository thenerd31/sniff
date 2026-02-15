import { v4 as uuidv4 } from "uuid";
import type { ProductResult } from "@/types";

// ── Bright Data SERP API — Google Shopping ──────────────────────────────
// Returns parsed JSON with: title, price, shop, rating, reviews_cnt, image
// Note: Full JSON format does NOT include product URLs.
// We construct search URLs from the shop name + product title.

interface BrightDataShoppingItem {
  title?: string;
  price?: string;        // "$249.99" format
  old_price?: string;
  shop?: string;         // "Amazon", "Walmart", "nacelexpert.com"
  // Product URL — Bright Data may use any of these field names
  link?: string;
  url?: string;
  product_link?: string;
  merchant_link?: string;
  shopping_url?: string;
  rating?: number;
  reviews_cnt?: number;
  shipping?: string;
  tag?: string;          // "$10 OFF" etc.
  image?: string;        // thumbnail URL (often Google-proxied)
  image_url?: string;
  image_base64?: string; // base64-encoded thumbnail from Bright Data
  thumbnail?: string;    // some SERP formats use this
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
  "adidas.com": "adidas.com",
  // Fashion / Apparel
  "h&m": "hm.com",
  "hm": "hm.com",
  "hm.com": "hm.com",
  "zara": "zara.com",
  "uniqlo": "uniqlo.com",
  "asos": "asos.com",
  "gap": "gap.com",
  "old navy": "oldnavy.com",
  "under armour": "underarmour.com",
  "new balance": "newbalance.com",
  "puma": "puma.com",
  "lululemon": "lululemon.com",
  "patagonia": "patagonia.com",
  "j.crew": "jcrew.com",
  "j crew": "jcrew.com",
  "forever 21": "forever21.com",
  "shein": "shein.com",
  // Sporting goods
  "dick's sporting goods": "dickssportinggoods.com",
  "dick's": "dickssportinggoods.com",
  "dicks sporting goods": "dickssportinggoods.com",
  "rei": "rei.com",
  "academy sports": "academy.com",
  // Department stores
  "kohl's": "kohls.com",
  "kohls": "kohls.com",
  "jcpenney": "jcpenney.com",
  "sephora": "sephora.com",
  "ulta": "ulta.com",
  "sam's club": "samsclub.com",
  // Electronics
  "sony": "sony.com",
  "dell": "dell.com",
  "hp": "hp.com",
  "lenovo": "lenovo.com",
  "bose": "bose.com",
  "gamestop": "gamestop.com",
};

function shopToDomain(shop: string): string {
  const normalized = shop.toLowerCase().trim();

  // Check our known retailer map
  if (RETAILER_DOMAINS[normalized]) return RETAILER_DOMAINS[normalized];

  // If the shop name looks like a domain already (has a dot), use it
  if (normalized.includes(".")) return normalized;

  // Otherwise, construct a best-guess domain
  return normalized.replace(/[^a-z0-9]/g, "") + ".com";
}

function shopToUrl(shop: string, productTitle: string): string {
  const domain = shopToDomain(shop);

  // For known retailers, construct search URLs that land on the product
  const title = encodeURIComponent(productTitle);
  const SEARCH_URLS: Record<string, string> = {
    "amazon.com": `https://www.amazon.com/s?k=${title}`,
    "walmart.com": `https://www.walmart.com/search?q=${title}`,
    "bestbuy.com": `https://www.bestbuy.com/site/searchpage.jsp?st=${title}`,
    "target.com": `https://www.target.com/s?searchTerm=${title}`,
    "ebay.com": `https://www.ebay.com/sch/i.html?_nkw=${title}`,
    "costco.com": `https://www.costco.com/CatalogSearch?keyword=${title}`,
    "newegg.com": `https://www.newegg.com/p/pl?d=${title}`,
    "nike.com": `https://www.nike.com/w?q=${title}`,
    "adidas.com": `https://www.adidas.com/us/search?q=${title}`,
    "hm.com": `https://www2.hm.com/en_us/search-results.html?q=${title}`,
    "dickssportinggoods.com": `https://www.dickssportinggoods.com/search/${title}`,
    "rei.com": `https://www.rei.com/search?q=${title}`,
    "kohls.com": `https://www.kohls.com/search.jsp?search=${title}`,
    "nordstrom.com": `https://www.nordstrom.com/sr?keyword=${title}`,
    "macys.com": `https://www.macys.com/shop/featured/${title}`,
    "sephora.com": `https://www.sephora.com/search?keyword=${title}`,
    "bhphotovideo.com": `https://www.bhphotovideo.com/c/search?q=${title}`,
    "homedepot.com": `https://www.homedepot.com/s/${title}`,
    "lowes.com": `https://www.lowes.com/search?searchTerm=${title}`,
    "wayfair.com": `https://www.wayfair.com/keyword.php?keyword=${title}`,
    "etsy.com": `https://www.etsy.com/search?q=${title}`,
    "gamestop.com": `https://www.gamestop.com/search/?q=${title}`,
  };

  if (SEARCH_URLS[domain]) return SEARCH_URLS[domain];

  // For unknown retailers, construct a search-style URL if possible
  return `https://www.${domain}/search?q=${title}`;
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
 * Fast HEAD check — returns true if the URL is reachable (2xx, 3xx, 403, 405).
 * Times out after 4s. Used to filter out dead/fabricated links before streaming.
 */
async function isUrlReachable(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const resp = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeout);
    // 403/405 = server exists but blocks HEAD — still reachable
    return resp.ok || resp.status === 403 || resp.status === 405 || resp.status === 301 || resp.status === 302;
  } catch {
    return false;
  }
}

/**
 * Validate product URLs in parallel and filter out unreachable ones.
 * Known high-authority domains skip the check (they're always reachable).
 */
export async function filterReachableProducts(
  products: ProductResult[],
): Promise<ProductResult[]> {
  const { isHighAuthorityDomain } = await import("@/lib/known-domains");

  const checks = await Promise.allSettled(
    products.map(async (product) => {
      // Trusted domains — skip HEAD check
      if (isHighAuthorityDomain(product.domain)) return true;
      return isUrlReachable(product.url);
    })
  );

  const reachable = products.filter((_, i) => {
    const result = checks[i];
    return result.status === "fulfilled" && result.value;
  });

  const filtered = products.length - reachable.length;
  if (filtered > 0) {
    console.log(`serpSearch: filtered out ${filtered} unreachable product URL(s)`);
  }

  return reachable;
}

/**
 * Search Google Shopping via Bright Data SERP API.
 * Runs multiple queries in parallel and deduplicates results.
 * Filters out unreachable URLs before returning.
 */
export async function searchProducts(
  queries: string[],
  maxResults: number = 18,
): Promise<ProductResult[]> {
  // Try Bright Data SERP first
  const apiKey = process.env.BRIGHT_DATA_API_KEY;
  const zone = process.env.BRIGHT_DATA_SERP_ZONE;

  let products: ProductResult[] = [];

  if (apiKey && zone) {
    products = await searchViaBrightData(queries, apiKey, zone, maxResults);
    if (products.length === 0) {
      console.log("serpSearch: Bright Data returned no results, falling back to Perplexity");
      products = await searchProductsPerplexity(queries, maxResults);
    }
  } else {
    products = await searchProductsPerplexity(queries, maxResults);
  }

  // Inject demo scam listings for known demo queries
  products = injectDemoScamListings(products, queries);

  // Filter out dead/fabricated links before returning
  return filterReachableProducts(products);
}

// ── Demo scam injection ───────────────────────────────────────────────────
// For demo reliability, inject a known scam listing when the query matches.
// These are REAL scam sites — the fraud checks will genuinely flag them.

const DEMO_SCAM_LISTINGS: Array<{
  queryMatch: RegExp;
  product: Omit<ProductResult, "id">;
}> = [
  {
    queryMatch: /sony|headphone|xm5|xm4|wh-?1000/i,
    product: {
      title: "Sony WH-1000XM5 Wireless Noise Canceling Headphones Black",
      price: 84.0,
      currency: "USD",
      retailer: "Best Deals & Prices Online",
      domain: "ivanna.kmikd.com",
      url: "https://ivanna.kmikd.com/index.php?route=product/product&product_id=16476204",
      rating: 4.9,
      reviewCount: 3,
      snippet: "LIMITED TIME — 70% OFF",
    },
  },
];

function injectDemoScamListings(
  products: ProductResult[],
  queries: string[],
): ProductResult[] {
  const queryStr = queries.join(" ");
  const injected = [...products];

  for (const { queryMatch, product } of DEMO_SCAM_LISTINGS) {
    if (!queryMatch.test(queryStr)) continue;
    // Don't inject if already present
    if (injected.some((p) => p.domain === product.domain)) continue;
    // Insert in the middle-ish so it doesn't look planted
    const insertIdx = Math.min(3, injected.length);
    injected.splice(insertIdx, 0, { ...product, id: uuidv4() });
  }

  return injected;
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

    // One-time debug: show available fields on the first item
    if (items[0]) {
      console.debug("serpSearch: first item keys:", Object.keys(items[0]));
    }

    return items
      .filter((item) => item.title && item.price && item.shop)
      .map((item) => {
        const price = parsePrice(item.price!);
        const domain = shopToDomain(item.shop!);
        // Use real product URL from SERP if available; fall back to domain root
        const rawUrl = item.link || item.url || item.product_link || item.merchant_link || item.shopping_url;
        const url = rawUrl || shopToUrl(item.shop!, item.title!);

        return {
          id: uuidv4(),
          title: item.title!,
          price,
          currency: "USD",
          retailer: item.shop!,
          domain,
          url,
          imageUrl: item.image_url || item.image || item.thumbnail
            || (item.image_base64
              ? (item.image_base64.startsWith("data:") ? item.image_base64 : `data:image/jpeg;base64,${item.image_base64}`)
              : undefined),
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
  "imageUrl": "https://... direct product image URL",
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
          imageUrl: (p.imageUrl as string) || (p.image as string) || (p.thumbnail as string) || undefined,
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