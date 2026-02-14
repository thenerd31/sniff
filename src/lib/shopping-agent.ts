// src/lib/shopping-agent.ts
// Multimodal shopping agent — accepts text and/or an image, identifies the
// product using gpt-5-mini vision, then searches Google Shopping via
// Bright Data SERP (with Perplexity fallback) from serpSearch.ts.

import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";
import { searchProducts } from "./tools/serpSearch";
import type { EvidenceCard, ProductResult } from "@/types";

const openai = new OpenAI();

const VISION_MODEL = "gpt-5-mini";

export interface ShoppingAgentInput {
  /** Free-text description or search query from the user (optional). */
  text?: string;
  /**
   * Base64-encoded image bytes — no data-URI prefix needed.
   * The route strips "data:image/...;base64," before passing here.
   */
  imageBase64?: string;
  /** MIME type of the uploaded image, e.g. "image/jpeg". */
  imageMediaType?: string;
}

interface SSEWriter {
  send: (event: string, data: unknown) => void;
  close: () => void;
}

// ── Convert ProductResult → EvidenceCard ────────────────────────────────────

function toCard(p: ProductResult): EvidenceCard {
  const parts: string[] = [];
  if (p.price > 0) parts.push(`$${p.price.toFixed(2)}`);
  if (p.snippet) parts.push(p.snippet);
  if (p.rating) parts.push(`${p.rating}★ (${p.reviewCount ?? 0} reviews)`);

  return {
    id: p.id ?? uuidv4(),
    type: "price",
    severity: "info",
    title: p.title,
    detail: [p.retailer, ...parts].filter(Boolean).join(" · "),
    source: "Google Shopping (Bright Data)",
    confidence: 0.9,
    connections: [],
    metadata: {
      retailer: p.retailer,
      price: p.price,
      currency: p.currency,
      url: p.url,
      inStock: true,
      imageUrl: p.imageUrl ?? null,
      rating: p.rating ?? null,
      reviews: p.reviewCount ?? null,
      snippet: p.snippet ?? null,
    },
  };
}

// ── Main agent ───────────────────────────────────────────────────────────────

/**
 * runShoppingAgent
 *
 * 1. If an image is supplied, call gpt-5-mini with vision to extract a
 *    concise product search query.
 * 2. Merge vision output + user text into a final query.
 * 3. Call searchProducts() from serpSearch.ts (Bright Data → Perplexity).
 * 4. Stream each result as a `price` EvidenceCard via SSE.
 */
export async function runShoppingAgent(
  input: ShoppingAgentInput,
  writer: SSEWriter
): Promise<void> {
  const { text, imageBase64, imageMediaType } = input;

  // ── Step 1: Vision understanding ─────────────────────────────────────────
  let visionQuery: string | null = null;

  if (imageBase64) {
    const mediaType = imageMediaType ?? "image/jpeg";
    const dataUrl = `data:${mediaType};base64,${imageBase64}`;

    const visionResp = await openai.chat.completions.create({
      model: VISION_MODEL,
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: dataUrl, detail: "low" },
            },
            {
              type: "text",
              text: [
                "Identify the product in this image.",
                "Return ONLY a concise Google Shopping search query",
                "(brand + model + product type) — no extra prose.",
                text ? `The user also says: "${text}"` : "",
              ]
                .filter(Boolean)
                .join(" "),
            },
          ],
        },
      ],
    });

    visionQuery = visionResp.choices[0]?.message.content?.trim() ?? null;

    if (visionQuery) {
      writer.send("narration", { text: `Vision: "${visionQuery}"` });
    }
  }

  // ── Step 2: Build search query ───────────────────────────────────────────
  const searchQuery = [visionQuery, text].filter(Boolean).join(" ").trim();

  if (!searchQuery) {
    writer.send("error", {
      message: "No product description found — provide text or an image.",
    });
    writer.close();
    return;
  }

  writer.send("narration", {
    text: `Searching Google Shopping for: "${searchQuery}"`,
  });

  // ── Step 3: Search (Bright Data SERP → Perplexity fallback) ─────────────
  let results: ProductResult[];
  try {
    results = await searchProducts([searchQuery]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    writer.send("error", { message: `Shopping search failed: ${msg}` });
    writer.close();
    return;
  }

  if (results.length === 0) {
    writer.send("narration", { text: "No shopping results found." });
    writer.send("done", { summary: "No results found." });
    writer.close();
    return;
  }

  // ── Step 4: Stream cards ─────────────────────────────────────────────────
  for (const result of results) {
    writer.send("card", toCard(result));
  }

  const priced = results.filter((r) => r.price > 0);
  const best = priced.sort((a, b) => a.price - b.price)[0];

  const summary = best
    ? `Found ${results.length} results. Best price: ${best.retailer} at $${best.price.toFixed(2)}`
    : `Found ${results.length} results.`;

  writer.send("done", { summary });
  writer.close();
}
