import { NextRequest } from "next/server";
import { createSSEResponse } from "@/lib/stream";
import OpenAI from "openai";
import { priceSearch } from "@/lib/tools/priceSearch";
import type { EvidenceCard } from "@/types";

const openai = new OpenAI();

// ── Route Handler ──────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { url: productUrl } = await req.json();
  const { send, close, response } = createSSEResponse();

  (async () => {
    try {
      // Step 1: Extract product name from URL via OpenAI
      const extraction = await openai.responses.create({
        model: "gpt-4o-mini",
        input: `Extract the product name from this URL. Return ONLY the product name, nothing else: ${productUrl}`,
      });

      const textOutput = extraction.output.find((item) => item.type === "message");
      let productName = "";
      if (textOutput && textOutput.type === "message") {
        const textContent = textOutput.content.find((c) => c.type === "output_text");
        if (textContent && textContent.type === "output_text") {
          productName = textContent.text;
        }
      }

      if (!productName) {
        send("error", { message: "Could not extract product name" });
        close();
        return;
      }

      send("narration", { text: `Searching prices for "${productName}"...` });

      // Step 2: Search prices (Yifan's tool)
      const priceCards = await priceSearch(productUrl);
      const cardIds: string[] = [];

      // Step 3: Emit price cards
      for (const card of priceCards) {
        cardIds.push(card.id);
        send("card", card);
        await new Promise((r) => setTimeout(r, 500));
      }

      // Step 4: Calculate savings
      const prices = priceCards
        .map((c: EvidenceCard) => c.metadata?.price as number)
        .filter((p): p is number => typeof p === "number" && p > 0);

      if (prices.length > 1) {
        const maxPrice = Math.max(...prices);
        const minPrice = Math.min(...prices);
        const savings = maxPrice - minPrice;

        if (savings > 0) {
          const savingsCard: EvidenceCard = {
            id: `savings-${Date.now()}`,
            type: "alert",
            severity: "safe",
            title: `Save $${savings.toFixed(2)}`,
            detail: `Best price: $${minPrice.toFixed(2)} vs highest: $${maxPrice.toFixed(2)}`,
            source: "Price Analysis",
            confidence: 0.9,
            connections: cardIds,
            metadata: { savings },
          };
          send("card", savingsCard);

          for (const targetId of cardIds) {
            send("connection", { from: savingsCard.id, to: targetId });
          }
        }
      }

      send("done", {
        summary: `Found ${priceCards.length} prices for ${productName}`,
      });
    } catch (error) {
      console.error("Compare error:", error);
      send("error", { message: "Price comparison failed" });
    } finally {
      close();
    }
  })();

  return response;
}
