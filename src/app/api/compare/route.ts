import { NextRequest } from "next/server";
import { createSSEResponse } from "@/lib/stream";
import OpenAI from "openai";
import { scrapeOriginalProduct, searchPrices } from "@/lib/tools/brightdata";
import { priceSearch } from "@/lib/tools/priceSearch";
import type { EvidenceCard } from "@/types";
import { v4 as uuidv4 } from "uuid";

const openai = new OpenAI();

// ── Multi-Step Price Comparison Agent ───────────────────────────────────
// Step 1: Extract product name (LLM)
// Step 2: Scrape original URL for real price (Bright Data)
// Step 3: Search Google Shopping / retailers for alternatives (Bright Data)
// Step 4: Fallback to Perplexity if Bright Data returns nothing
// Step 5: Agent synthesizes — best deal, savings, recommendation

export async function POST(req: NextRequest) {
  const { url: productUrl } = await req.json();
  const { send, close, response } = createSSEResponse();

  (async () => {
    try {
      // ── STEP 1: Scrape original product URL ─────────────────────────
      send("narration", { text: "Scraping product page..." });

      const allCards: EvidenceCard[] = [];
      let productName = "";

      // Scrape original product first — this gives us the real price AND the product name
      const originalCard = await scrapeOriginalProduct(productUrl);

      if (originalCard) {
        // Extract product name from the scraped title for Google Shopping search
        productName = (originalCard.metadata?.retailer ? originalCard.detail.split(" — ")[0] : "") || originalCard.title;
        originalCard.title = `Original: ${originalCard.title}`;
        originalCard.metadata = { ...originalCard.metadata, isOriginal: true };
        send("card", originalCard);
        allCards.push(originalCard);
        send("narration", { text: `Found: "${productName}" — searching other retailers...` });
      }

      // If we couldn't scrape, extract name from URL via LLM
      if (!productName) {
        const extraction = await openai.responses.create({
          model: "gpt-4o-mini",
          input: `What product is this URL for? Return ONLY the product name (e.g. "Apple AirPods Pro 2", "Sony WH-1000XM5"). URL: ${productUrl}`,
        });
        const textOutput = extraction.output.find((item) => item.type === "message");
        if (textOutput && textOutput.type === "message") {
          const textContent = textOutput.content.find((c) => c.type === "output_text");
          if (textContent && textContent.type === "output_text") {
            productName = textContent.text.trim();
          }
        }
        send("narration", { text: `Searching prices for "${productName}"...` });
      }

      if (!productName) {
        send("error", { message: "Could not identify product" });
        close();
        return;
      }

      // ── STEP 2: Search alternatives in parallel ────────────────────
      const [shoppingCards, perplexityCards] = await Promise.allSettled([
        searchPrices(productName),
        priceSearch(productUrl),
      ]);

      // Stream Google Shopping results
      if (shoppingCards.status === "fulfilled" && shoppingCards.value.length > 0) {
        send("narration", { text: "Found prices from Google Shopping..." });
        for (const card of shoppingCards.value) {
          send("card", card);
          allCards.push(card);
          await new Promise((r) => setTimeout(r, 300));
        }
      }

      // If only original card (or nothing), use Perplexity as fallback
      const brightDataCount = allCards.length;
      if (brightDataCount <= 1 && perplexityCards.status === "fulfilled") {
        send("narration", { text: "Searching additional retailers..." });
        const fallbackCards = perplexityCards.value.filter(
          (c) => c.metadata?.price && c.metadata.price > 0
        );
        for (const card of fallbackCards) {
          card.confidence = Math.max(0.3, card.confidence - 0.2);
          card.metadata = { ...card.metadata, verified: false };
          send("card", card);
          allCards.push(card);
          await new Promise((r) => setTimeout(r, 300));
        }
      }

      if (allCards.length === 0) {
        send("error", { message: "Could not find prices for this product" });
        close();
        return;
      }

      // ── STEP 5: Agent synthesis — best deal, savings, recommendation ──
      send("narration", { text: "Analyzing prices..." });

      const prices = allCards
        .map((c) => ({
          id: c.id,
          retailer: c.metadata?.retailer as string,
          price: c.metadata?.price as number,
          inStock: c.metadata?.inStock as boolean,
          verified: c.metadata?.verified as boolean,
          isOriginal: c.metadata?.isOriginal as boolean,
        }))
        .filter((p) => typeof p.price === "number" && p.price > 0);

      if (prices.length > 1) {
        // Sort by price
        prices.sort((a, b) => a.price - b.price);
        const cheapest = prices[0];
        const mostExpensive = prices[prices.length - 1];
        const savings = mostExpensive.price - cheapest.price;

        // Find original price for comparison
        const original = prices.find((p) => p.isOriginal);
        const savingsVsOriginal = original ? original.price - cheapest.price : 0;

        if (savings > 0) {
          const savingsCard: EvidenceCard = {
            id: uuidv4(),
            type: "alert",
            severity: savingsVsOriginal > 0 ? "safe" : "info",
            title: savingsVsOriginal > 0
              ? `Save $${savingsVsOriginal.toFixed(2)} vs original`
              : `Price range: $${savings.toFixed(2)} spread`,
            detail: `Best price: $${cheapest.price.toFixed(2)} at ${cheapest.retailer}${original ? ` (original listing: $${original.price.toFixed(2)} at ${original.retailer})` : ""}. ${prices.length} retailers compared.`,
            source: "Sentinel Price Agent",
            confidence: 0.95,
            connections: allCards.map((c) => c.id),
            metadata: {
              savings,
              savingsVsOriginal,
              cheapestRetailer: cheapest.retailer,
              cheapestPrice: cheapest.price,
            },
          };
          send("card", savingsCard);

          // Connect savings card to all price cards
          for (const card of allCards) {
            send("connection", {
              from: savingsCard.id,
              to: card.id,
              label: card.metadata?.isOriginal ? "original listing" : "alternative",
            });
          }
        }
      }

      // Narrate the result
      const verifiedCount = allCards.filter((c) => c.metadata?.verified).length;
      send("narration", {
        text: `Compared ${allCards.length} prices${verifiedCount > 0 ? ` (${verifiedCount} verified via live scraping)` : ""}. ${brightDataCount > 0 ? "Prices scraped directly from retailer websites." : "Prices sourced via web search."}`,
      });

      send("done", {
        summary: `Found ${allCards.length} prices for ${productName}`,
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
