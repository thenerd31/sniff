import { v4 as uuidv4 } from "uuid";
import type { EvidenceCard } from "@/types";

interface PerplexityMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface PerplexityChoice {
  message: { content: string };
}

interface PerplexityResponse {
  choices: PerplexityChoice[];
}

interface PriceResult {
  retailer: string;
  price: number;
  currency: string;
  url: string;
  inStock: boolean;
}

export async function priceSearch(productUrl: string): Promise<EvidenceCard[]> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    return [
      {
        id: uuidv4(),
        type: "price",
        severity: "info",
        title: "Price search skipped",
        detail: "Perplexity API key not configured",
        source: "Perplexity Sonar",
        confidence: 0,
        connections: [],
        metadata: { skipped: true },
      },
    ];
  }

  try {
    const messages: PerplexityMessage[] = [
      {
        role: "system",
        content: `You are a price comparison assistant. Given a product URL, find the same or very similar product on other legitimate retailers. Return ONLY a JSON array of objects with these fields: retailer (string), price (number), currency (string, e.g. "USD"), url (string), inStock (boolean). Return at most 5 results. If you cannot find prices, return an empty array [].`,
      },
      {
        role: "user",
        content: `Find prices for the product at this URL across legitimate retailers: ${productUrl}`,
      },
    ];

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API returned ${response.status}`);
    }

    const data: PerplexityResponse = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";

    // Extract JSON array from response (may be wrapped in markdown code block)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [
        {
          id: uuidv4(),
          type: "price",
          severity: "info",
          title: "No price data found",
          detail: "Could not find comparable prices for this product",
          source: "Perplexity Sonar",
          confidence: 0.4,
          connections: [],
          metadata: { rawResponse: content },
        },
      ];
    }

    const prices: PriceResult[] = JSON.parse(jsonMatch[0]);

    if (prices.length === 0) {
      return [
        {
          id: uuidv4(),
          type: "price",
          severity: "info",
          title: "No comparable prices found",
          detail: "This product could not be found on other retailers",
          source: "Perplexity Sonar",
          confidence: 0.5,
          connections: [],
          metadata: {},
        },
      ];
    }

    return prices.map((p) => ({
      id: uuidv4(),
      type: "price" as const,
      severity: "info" as const,
      title: `${p.retailer}: ${p.currency} ${p.price.toFixed(2)}`,
      detail: `${p.inStock ? "In stock" : "Out of stock"} at ${p.retailer}`,
      source: "Perplexity Sonar",
      confidence: 0.7,
      connections: [],
      metadata: {
        retailer: p.retailer,
        price: p.price,
        currency: p.currency,
        url: p.url,
        inStock: p.inStock,
      },
    }));
  } catch (error) {
    return [
      {
        id: uuidv4(),
        type: "price",
        severity: "info",
        title: "Price search failed",
        detail: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        source: "Perplexity Sonar",
        confidence: 0,
        connections: [],
        metadata: { error: true },
      },
    ];
  }
}
