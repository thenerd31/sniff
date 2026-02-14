import { Stagehand, type AvailableModel } from "@browserbasehq/stagehand";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import type { EvidenceCard } from "@/types";

// ── Browserbase + Stagehand: AI-powered browser scraping ────────────────
// Uses Stagehand's extract() to get structured product data from any page.
// This is the "agentic" scraper — it navigates real browsers and uses AI
// to understand page structure, no CSS selectors needed.

const ProductSchema = z.object({
  name: z.string().describe("The full product name"),
  price: z.number().describe("The current price in USD (the final price the customer pays, not the original/crossed-out price)"),
  inStock: z.boolean().describe("Whether the product is currently in stock / available"),
  rating: z.number().optional().describe("Star rating out of 5"),
  reviewCount: z.number().optional().describe("Number of reviews"),
  seller: z.string().optional().describe("The seller or retailer name"),
});

const SearchResultsSchema = z.object({
  products: z.array(z.object({
    name: z.string().describe("Product name"),
    price: z.number().describe("Current price in USD"),
    url: z.string().describe("Link to the product page"),
    seller: z.string().optional().describe("Seller or retailer"),
    rating: z.number().optional().describe("Star rating"),
  })).describe("Top 5 product results matching the search query"),
});

async function createStagehand(): Promise<Stagehand> {
  const stagehand = new Stagehand({
    env: "BROWSERBASE",
    apiKey: process.env.BROWSERBASE_API_KEY,
    projectId: process.env.BROWSERBASE_PROJECT_ID,
    model: {
      modelName: "gpt-4o-mini" as AvailableModel,
      apiKey: process.env.OPENAI_API_KEY,
    },
  });
  await stagehand.init();
  return stagehand;
}

// ── Scrape a single product page ────────────────────────────────────────
export async function scrapeProductPage(url: string): Promise<EvidenceCard | null> {
  let stagehand: Stagehand | null = null;

  try {
    stagehand = await createStagehand();
    const page = stagehand.context.pages()[0];
    await page.goto(url, { waitUntil: "domcontentloaded", timeoutMs: 20000 });

    // AI extracts structured product data from ANY page layout
    const product = await stagehand.extract(
      "Extract the product name, current price (in USD, the price the customer actually pays today), stock availability, star rating, review count, and seller name from this product page.",
      ProductSchema,
    );

    if (!product || !product.price || product.price <= 0) return null;

    const host = new URL(url).hostname.replace(/^www\./, "");

    return {
      id: uuidv4(),
      type: "price",
      severity: "info",
      title: `${host}: $${product.price.toFixed(2)}`,
      detail: `${product.name} — ${product.inStock ? "In stock" : "Out of stock"}${product.rating ? ` (${product.rating}★)` : ""}`,
      source: "Browserbase Scraper",
      confidence: 0.95,
      connections: [],
      metadata: {
        retailer: product.seller || host,
        price: product.price,
        currency: "USD",
        url,
        inStock: product.inStock,
        rating: product.rating,
        reviewsCount: product.reviewCount,
        seller: product.seller,
        verified: true,
      },
    };
  } catch (error) {
    console.error("Browserbase scrape failed:", error);
    return null;
  } finally {
    if (stagehand) {
      try { await stagehand.close(); } catch {}
    }
  }
}

// ── Search a retailer for a product ─────────────────────────────────────
export async function searchRetailer(
  retailerUrl: string,
  productName: string,
  retailerName: string,
): Promise<EvidenceCard[]> {
  let stagehand: Stagehand | null = null;

  try {
    stagehand = await createStagehand();
    const page = stagehand.context.pages()[0];
    await page.goto(retailerUrl, { waitUntil: "domcontentloaded", timeoutMs: 20000 });

    // Use AI to search for the product
    await stagehand.act(`Search for "${productName}" using the search bar`);

    // Wait for results to load
    await page.waitForTimeout(3000);

    // Extract search results
    const results = await stagehand.extract(
      `Extract the top 5 product results that match "${productName}". Get each product's name, price in USD, URL, seller, and rating.`,
      SearchResultsSchema,
    );

    if (!results?.products?.length) return [];

    return results.products
      .filter((p) => p.price > 0)
      .slice(0, 3)
      .map((p) => ({
        id: uuidv4(),
        type: "price" as const,
        severity: "info" as const,
        title: `${retailerName}: $${p.price.toFixed(2)}`,
        detail: `${p.name}${p.rating ? ` (${p.rating}★)` : ""}`,
        source: "Browserbase / " + retailerName,
        confidence: 0.9,
        connections: [],
        metadata: {
          retailer: retailerName,
          price: p.price,
          currency: "USD",
          url: p.url,
          inStock: true,
          verified: true,
          rating: p.rating,
          seller: p.seller,
        },
      }));
  } catch (error) {
    console.error(`Browserbase search on ${retailerName} failed:`, error);
    return [];
  } finally {
    if (stagehand) {
      try { await stagehand.close(); } catch {}
    }
  }
}

// ── Search multiple retailers in parallel ───────────────────────────────
export async function searchAllRetailers(productName: string): Promise<EvidenceCard[]> {
  const retailers = [
    { name: "Walmart", url: "https://www.walmart.com" },
    { name: "Best Buy", url: "https://www.bestbuy.com" },
    { name: "Target", url: "https://www.target.com" },
  ];

  const results = await Promise.allSettled(
    retailers.map((r) => searchRetailer(r.url, productName, r.name))
  );

  return results
    .filter((r): r is PromiseFulfilledResult<EvidenceCard[]> => r.status === "fulfilled")
    .flatMap((r) => r.value);
}
