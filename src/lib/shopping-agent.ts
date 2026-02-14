// src/lib/shopping-agent.ts
// Multimodal shopping agent — accepts text and/or an image, identifies the
// product using GPT-4o-mini vision, then searches Google Shopping via SerpAPI.

import OpenAI from "openai";
import { serpShoppingSearch } from "./tools/serp-shopping";
import type { EvidenceCard } from "@/types";

const openai = new OpenAI();

// The model used for vision-based product identification.
// Change this constant if you want to swap models.
const VISION_MODEL = "gpt-4o-mini";

export interface ShoppingAgentInput {
  /** Free-text description or search query from the user (optional). */
  text?: string;
  /**
   * Base64-encoded image bytes — no data-URI prefix needed.
   * The route should strip "data:image/...;base64," before passing here.
   */
  imageBase64?: string;
  /** MIME type of the uploaded image, e.g. "image/jpeg". */
  imageMediaType?: string;
}

interface SSEWriter {
  send: (event: string, data: unknown) => void;
  close: () => void;
}

/**
 * runShoppingAgent
 *
 * 1. If an image is supplied, send it to GPT-4o-mini to extract a clear
 *    product description / search query.
 * 2. Merge the vision output with any text the user typed.
 * 3. Query SerpAPI Google Shopping.
 * 4. Stream each result as a `price` EvidenceCard via SSE.
 */
export async function runShoppingAgent(
  input: ShoppingAgentInput,
  writer: SSEWriter
): Promise<void> {
  const { text, imageBase64, imageMediaType } = input;

  // ── Step 1: Vision understanding ────────────────────────────────────────
  let visionDescription: string | null = null;

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

    visionDescription =
      visionResp.choices[0]?.message.content?.trim() ?? null;

    if (visionDescription) {
      // Let the frontend know what the agent "sees"
      writer.send("narration", {
        text: `Vision analysis: "${visionDescription}"`,
      });
    }
  }

  // ── Step 2: Build search query ───────────────────────────────────────────
  const searchQuery = [visionDescription, text].filter(Boolean).join(" ").trim();

  if (!searchQuery) {
    writer.send("error", { message: "No product description found — provide text or an image." });
    writer.close();
    return;
  }

  writer.send("narration", { text: `Searching Google Shopping for: "${searchQuery}"` });

  // ── Step 3: SerpAPI Google Shopping ─────────────────────────────────────
  let cards: EvidenceCard[];
  try {
    cards = await serpShoppingSearch(searchQuery);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    writer.send("error", { message: `Shopping search failed: ${msg}` });
    writer.close();
    return;
  }

  if (cards.length === 0) {
    writer.send("narration", { text: "No shopping results found for this query." });
    writer.send("done", { summary: "No results found." });
    writer.close();
    return;
  }

  // ── Step 4: Stream cards ─────────────────────────────────────────────────
  for (const card of cards) {
    writer.send("card", card);
  }

  // Best deal = lowest non-zero price
  const priced = cards.filter((c) => (c.metadata.price as number) > 0);
  const bestDeal = priced.sort(
    (a, b) => (a.metadata.price as number) - (b.metadata.price as number)
  )[0];

  const summary = bestDeal
    ? `Found ${cards.length} results. Best price: ${bestDeal.metadata.retailer} at $${bestDeal.metadata.price}`
    : `Found ${cards.length} results.`;

  writer.send("done", { summary });
  writer.close();
}
