import { NextRequest } from "next/server";
import { createSSEResponse } from "@/lib/stream";
import OpenAI from "openai";
import { v4 as uuid } from "uuid";

// Tool implementation — Yifan builds this
import { searchPrices } from "@/lib/tools/priceSearch";

const openai = new OpenAI();

// ── Route Handler ──────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { url: productUrl } = await req.json();
  const { send, close, response } = createSSEResponse();

  (async () => {
    try {
      // Step 1: Use OpenAI to extract the product name from the URL
      const extraction = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `Extract the product name from this URL. Return ONLY the product name, nothing else: ${productUrl}`,
          },
        ],
      });
      const productName = extraction.choices[0].message.content || "";

      // Step 2: Search for prices across retailers (Yifan's tool)
      const { results } = await searchPrices(productName);

      // Step 3: Emit a price card for each retailer
      const cardIds: string[] = [];
      for (const result of results) {
        const id = uuid();
        cardIds.push(id);
        send("card", {
          id,
          type: "price",
          severity: "info",
          title: `${result.retailer}: $${result.price}`,
          detail: result.inStock ? "In stock" : "Out of stock",
          source: result.retailer,
          confidence: 0.8,
          connections: [],
          metadata: result,
        });

        // Stagger cards for animation effect
        await new Promise((r) => setTimeout(r, 500));
      }

      // Step 4: Calculate and emit savings card
      if (results.length > 1) {
        const prices = results
          .map((r: { price: number }) => r.price)
          .filter((p: number) => p > 0);
        const maxPrice = Math.max(...prices);
        const minPrice = Math.min(...prices);
        const savings = maxPrice - minPrice;

        if (savings > 0) {
          const savingsId = uuid();
          send("card", {
            id: savingsId,
            type: "alert",
            severity: "safe",
            title: `Save $${savings.toFixed(2)}`,
            detail: `Best price: $${minPrice.toFixed(2)} vs highest: $${maxPrice.toFixed(2)}`,
            source: "Price Analysis",
            confidence: 0.9,
            connections: cardIds,
            metadata: { savings },
          });

          // Connect savings card to all price cards
          for (const targetId of cardIds) {
            send("connection", { from: savingsId, to: targetId });
          }
        }
      }

      send("done", {
        summary: `Found ${results.length} prices for ${productName}`,
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
