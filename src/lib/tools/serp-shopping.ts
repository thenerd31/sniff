// src/lib/tools/serp-shopping.ts
// SerpAPI Google Shopping — returns price EvidenceCards for a search query

import { v4 as uuidv4 } from "uuid";
import type { EvidenceCard } from "@/types";

const SERPAPI_KEY = process.env.SERPAPI_KEY ?? "";

interface SerpShoppingResult {
  title: string;
  link: string;
  source: string;        // retailer name, e.g. "Amazon"
  price?: string;        // "$29.99"
  extracted_price?: number;
  rating?: number;
  reviews?: number;
  thumbnail?: string;
  delivery?: string;
}

interface SerpResponse {
  shopping_results?: SerpShoppingResult[];
  error?: string;
}

export async function serpShoppingSearch(
  query: string,
  limit = 8
): Promise<EvidenceCard[]> {
  if (!SERPAPI_KEY) {
    throw new Error("SERPAPI_KEY is not set");
  }

  const params = new URLSearchParams({
    engine: "google_shopping",
    q: query,
    api_key: SERPAPI_KEY,
    num: String(limit),
    gl: "us",
    hl: "en",
  });

  const res = await fetch(
    `https://serpapi.com/search.json?${params.toString()}`
  );

  if (!res.ok) {
    throw new Error(`SerpAPI HTTP ${res.status}: ${res.statusText}`);
  }

  const json = (await res.json()) as SerpResponse;

  if (json.error) {
    throw new Error(`SerpAPI error: ${json.error}`);
  }

  const results = json.shopping_results ?? [];

  return results.slice(0, limit).map((item) => {
    const price = item.extracted_price ?? null;

    return {
      id: uuidv4(),
      type: "price" as const,
      severity: "info" as const,
      title: item.title,
      detail: [
        item.source && `Sold by ${item.source}`,
        item.price && `Price: ${item.price}`,
        item.delivery && `Delivery: ${item.delivery}`,
        item.rating && `Rating: ${item.rating}/5 (${item.reviews ?? 0} reviews)`,
      ]
        .filter(Boolean)
        .join(" · "),
      source: "Google Shopping (SerpAPI)",
      confidence: 0.9,
      connections: [],
      metadata: {
        retailer: item.source ?? "Unknown",
        price: price ?? 0,
        currency: "USD",
        url: item.link,
        inStock: true, // Google Shopping only lists in-stock items by default
        thumbnail: item.thumbnail ?? null,
        rating: item.rating ?? null,
        reviews: item.reviews ?? null,
        delivery: item.delivery ?? null,
      },
    } satisfies EvidenceCard;
  });
}
