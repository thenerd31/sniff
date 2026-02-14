// src/lib/shopping-agent.ts
// Multimodal shopping agent — accepts text and/or an image, identifies the
// product using gpt-5-mini vision, searches Google Shopping via Bright Data
// SERP, then validates each result for fraud before streaming results.

import OpenAI from "openai";
import { searchProducts } from "./tools/serpSearch";
import {
  validateProduct,
  computeVerdict,
  computeMedianPrice,
} from "./tools/validate-product";
import type { ProductResult } from "@/types";

let _openai: OpenAI | null = null;
const getOpenAI = () => (_openai ??= new OpenAI());

const VISION_MODEL = "gpt-5-mini";

export interface ShoppingAgentInput {
  /** Free-text description or search query from the user (optional). */
  text?: string;
  /**
   * Pre-refined search query variants from the Guided Discovery refiner.
   * When provided these are used directly, bypassing the text/image step.
   */
  searchQueries?: string[];
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

// ── Main agent ───────────────────────────────────────────────────────────────

/**
 * runShoppingAgent
 *
 * 1. Optional vision step: gpt-5-mini extracts a product search query from image.
 * 2. searchProducts() via Bright Data SERP (Perplexity fallback).
 * 3. Stream `product` events for every result immediately.
 * 4. Run 4 fraud checks per product in parallel, stream `fraud_check` + `verdict`.
 * 5. Pick best trusted product, stream `best_pick`.
 * 6. Stream `done` with summary stats.
 *
 * SSE events emitted (SearchSSEEvent):
 *   narration       — progress text
 *   all_products    — { count } — total found before validation
 *   product         — ProductResult
 *   fraud_check     — { productId, check: FraudCheck }
 *   verdict         — { productId, verdict, trustScore }
 *   best_pick       — { productId, savings? }
 *   done            — { summary, totalProducts, trustedCount, flaggedCount }
 *   error           — { message }
 */
export async function runShoppingAgent(
  input: ShoppingAgentInput,
  writer: SSEWriter
): Promise<void> {
  const { text, searchQueries: preRefinedQueries, imageBase64, imageMediaType } = input;

  // ── Step 1: Build search queries ──────────────────────────────────────────
  // Priority: pre-refined queries from Guided Discovery > vision+text fallback
  let finalQueries: string[];

  if (preRefinedQueries && preRefinedQueries.length > 0) {
    // Already refined — skip vision step
    finalQueries = preRefinedQueries;
    writer.send("narration", {
      text: `Searching for: "${preRefinedQueries[0]}"`,
    });
  } else {
    // Fall back to vision + text
    let visionQuery: string | null = null;

    if (imageBase64) {
      const mediaType = imageMediaType ?? "image/jpeg";
      const dataUrl = `data:${mediaType};base64,${imageBase64}`;

      const visionResp = await getOpenAI().chat.completions.create({
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
        writer.send("narration", { text: `Identified: "${visionQuery}"` });
      }
    }

    const searchQuery = [visionQuery, text].filter(Boolean).join(" ").trim();

    if (!searchQuery) {
      writer.send("error", {
        message: "No product description found — provide text or an image.",
      });
      writer.close();
      return;
    }

    finalQueries = [searchQuery];
    writer.send("narration", {
      text: `Searching Google Shopping for: "${searchQuery}"`,
    });
  }

  // ── Step 2 (formerly Step 3): Search ─────────────────────────────────────
  let results: ProductResult[];
  try {
    results = await searchProducts(finalQueries);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    writer.send("error", { message: `Shopping search failed: ${msg}` });
    writer.close();
    return;
  }

  if (results.length === 0) {
    writer.send("narration", { text: "No shopping results found." });
    writer.send("done", {
      summary: "No results found.",
      totalProducts: 0,
      trustedCount: 0,
      flaggedCount: 0,
    });
    writer.close();
    return;
  }

  // ── Step 4: Stream all products immediately ───────────────────────────────
  writer.send("all_products", { count: results.length });
  for (const product of results) {
    writer.send("product", product);
  }

  writer.send("narration", {
    text: `Found ${results.length} listings. Running fraud checks...`,
  });

  // ── Step 5: Validate each product in parallel ─────────────────────────────
  const referencePrice = computeMedianPrice(results);

  type ValidatedProduct = {
    product: ProductResult;
    verdict: "trusted" | "caution" | "danger";
    trustScore: number;
  };

  const validated: ValidatedProduct[] = await Promise.all(
    results.map(async (product) => {
      const checks = await validateProduct(product, referencePrice);

      // Stream each individual check as it arrives
      for (const check of checks) {
        writer.send("fraud_check", { productId: product.id, check });
      }

      const { verdict, trustScore } = computeVerdict(checks);
      writer.send("verdict", { productId: product.id, verdict, trustScore });

      return { product, verdict, trustScore };
    })
  );

  // ── Step 6: Pick best trusted result ─────────────────────────────────────
  const trusted = validated.filter((v) => v.verdict === "trusted");
  const caution = validated.filter((v) => v.verdict === "caution");
  const danger  = validated.filter((v) => v.verdict === "danger");

  // Best pick = cheapest trusted product; fall back to cheapest caution
  const candidates = trusted.length > 0 ? trusted : caution;
  const bestPick = candidates
    .filter((v) => v.product.price > 0)
    .sort((a, b) => a.product.price - b.product.price)[0];

  if (bestPick) {
    const savings =
      referencePrice > 0 && bestPick.product.price < referencePrice
        ? referencePrice - bestPick.product.price
        : undefined;
    writer.send("best_pick", {
      productId: bestPick.product.id,
      savings:
        savings !== undefined ? parseFloat(savings.toFixed(2)) : undefined,
    });
  }

  // ── Step 7: Done ─────────────────────────────────────────────────────────
  const trustedCount = trusted.length;
  const flaggedCount = danger.length;

  const summaryParts: string[] = [
    `${results.length} listings found`,
    `${trustedCount} trusted`,
  ];
  if (flaggedCount > 0)
    summaryParts.push(`${flaggedCount} flagged as dangerous`);
  if (bestPick) {
    summaryParts.push(
      `best pick: ${bestPick.product.retailer} at $${bestPick.product.price.toFixed(2)}`
    );
  }

  writer.send("done", {
    summary: summaryParts.join(", "),
    totalProducts: results.length,
    trustedCount,
    flaggedCount,
  });
  writer.close();
}
