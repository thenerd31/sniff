import { v4 as uuidv4 } from "uuid";
import type { EvidenceCard } from "@/types";

// ── Bright Data Web Scraper API ─────────────────────────────────────────
// Pre-built scrapers return structured JSON with real prices.
// Uses /datasets/v3/trigger → poll /datasets/v3/snapshot (no zones needed).

const API_KEY = () => process.env.BRIGHT_DATA_API_KEY || "";

const DATASETS = {
  amazon_product: "gd_l7q7dkf244hwjntr0",
  amazon_search: "gd_lwdb4vjm1ehb499uxs",
  walmart_product: "gd_l95fol7l1ru6rlo116",
  bestbuy_product: "gd_ltre1jqe1jfr7cccf",
  ebay_product: "gd_ltr9mjt81n0zzdk1fb",
};

interface BrightDataProduct {
  title?: string;
  name?: string;
  price?: number;
  final_price?: number;
  currency?: string;
  availability?: string;
  in_stock?: boolean;
  rating?: number;
  reviews_count?: number;
  seller_name?: string;
  seller?: string;
  url?: string;
  link?: string;
  [key: string]: unknown;
}

// ── Core: trigger scrape + poll for results ─────────────────────────────
async function triggerAndPoll(
  datasetId: string,
  input: Record<string, unknown>[],
  timeoutSec = 60
): Promise<BrightDataProduct[]> {
  const key = API_KEY();
  if (!key) return [];

  try {
    console.log(`Bright Data: triggering dataset ${datasetId} with ${input.length} inputs`);
    const response = await fetch(
      `https://api.brightdata.com/datasets/v3/trigger?dataset_id=${datasetId}&include_errors=true&format=json`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!response.ok) {
      console.error(`Bright Data trigger failed: ${response.status}`);
      return [];
    }

    const triggerData = await response.json();

    // Data returned inline (rare)
    if (Array.isArray(triggerData) && triggerData.length > 0) return triggerData;

    // Need to poll
    const snapshotId = triggerData.snapshot_id;
    if (!snapshotId) {
      console.log("Bright Data: no snapshot_id returned");
      return [];
    }
    console.log(`Bright Data: polling snapshot ${snapshotId} (timeout: ${timeoutSec}s)`);

    for (let i = 0; i < timeoutSec; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      try {
        const pollRes = await fetch(
          `https://api.brightdata.com/datasets/v3/snapshot/${snapshotId}?format=json`,
          {
            headers: { Authorization: `Bearer ${key}` },
            signal: AbortSignal.timeout(10000),
          }
        );
        if (pollRes.status === 200) {
          const text = await pollRes.text();
          const data = JSON.parse(text);
          if (data?.status && ["running", "building", "starting"].includes(data.status)) continue;
          if (Array.isArray(data) && data.length > 0) return data;
          if (data && typeof data === "object" && !data.status) return [data];
        }
      } catch {
        // Parse error or network issue — keep polling
      }
    }
  } catch (error) {
    console.error("Bright Data error:", error);
  }

  return [];
}

// ── Detect retailer from URL ────────────────────────────────────────────
function detectRetailer(url: string): string | null {
  const host = new URL(url).hostname.toLowerCase();
  if (host.includes("amazon")) return "amazon";
  if (host.includes("walmart")) return "walmart";
  if (host.includes("bestbuy") || host.includes("best-buy")) return "bestbuy";
  if (host.includes("ebay")) return "ebay";
  return null;
}

function retailerLabel(r: string): string {
  return { amazon: "Amazon", walmart: "Walmart", bestbuy: "Best Buy", ebay: "eBay" }[r] || r;
}

function toCard(product: BrightDataProduct, retailer: string, source: string): EvidenceCard | null {
  const price = product.final_price ?? product.price;
  if (typeof price !== "number" || price <= 0) return null;

  const title = product.title || product.name || "Product";
  const inStock = product.in_stock ?? (product.availability?.toLowerCase().includes("in stock") ?? true);
  const label = retailerLabel(retailer);

  return {
    id: uuidv4(),
    type: "price",
    severity: "info",
    title: `${label}: $${price.toFixed(2)}`,
    detail: `${title} — ${inStock ? "In stock" : "Out of stock"} at ${label}${product.rating ? ` (${product.rating}★)` : ""}`,
    source,
    confidence: 0.95,
    connections: [],
    metadata: {
      retailer: label,
      price,
      currency: product.currency || "USD",
      url: product.url || product.link || "",
      inStock,
      rating: product.rating,
      reviewsCount: product.reviews_count,
      seller: product.seller_name || product.seller,
      verified: true,
    },
  };
}

// ── PUBLIC: Scrape the original product URL ─────────────────────────────
export async function scrapeOriginalProduct(url: string): Promise<EvidenceCard | null> {
  const retailer = detectRetailer(url);
  if (!retailer) return null;

  const datasetMap: Record<string, string> = {
    amazon: DATASETS.amazon_product,
    walmart: DATASETS.walmart_product,
    bestbuy: DATASETS.bestbuy_product,
    ebay: DATASETS.ebay_product,
  };

  const datasetId = datasetMap[retailer];
  if (!datasetId) return null;

  const results = await triggerAndPoll(datasetId, [{ url }], 20);
  if (results.length === 0) return null;

  return toCard(results[0], retailer, "Bright Data Scraper");
}

// ── PUBLIC: Search for the product on Amazon ────────────────────────────
export async function searchPrices(productName: string): Promise<EvidenceCard[]> {
  const results = await triggerAndPoll(
    DATASETS.amazon_search,
    [{ keyword: productName, url: "https://www.amazon.com" }],
    45
  );

  return results
    .slice(0, 5)
    .map((p) => toCard(p, "amazon", "Bright Data / Amazon Search"))
    .filter((c): c is EvidenceCard => c !== null);
}
