import { NextRequest } from "next/server";
import { createSSEResponse } from "@/lib/stream";
import { scrapeOriginalProduct } from "@/lib/tools/brightdata";
import { scrapeProductPage } from "@/lib/tools/browserbase";
import { findRetailerLinks, priceSearch } from "@/lib/tools/priceSearch";
import type { EvidenceCard } from "@/types";
import { v4 as uuidv4 } from "uuid";

// ── Agentic Price Comparison Pipeline ───────────────────────────────────
// Step 1: Scrape original product URL → get real price + product name
// Step 2: Perplexity finds the same product on other retailers (URLs only)
// Step 3: Scrape each retailer URL with Bright Data / Browserbase
// Step 4: Compare all verified prices, calculate savings
//
// This is truly agentic: research → discover → verify → recommend

export async function POST(req: NextRequest) {
  const { url: productUrl } = await req.json();
  const { send, close, response } = createSSEResponse();

  (async () => {
    try {
      const allCards: EvidenceCard[] = [];

      // ── STEP 1: Scrape original product ───────────────────────────
      send("narration", { text: "Scraping original product page..." });

      // Try Bright Data first (structured, fast for known retailers)
      let originalCard = await scrapeOriginalProduct(productUrl);

      // Fall back to Browserbase AI browser (works on any site)
      if (!originalCard) {
        send("narration", { text: "Using AI browser agent..." });
        originalCard = await scrapeProductPage(productUrl);
      }

      // Extract product name even if price scraping failed
      let productName = "";
      if (originalCard) {
        productName = originalCard.detail?.split(" — ")[0] || originalCard.title || "";
        const isNameOnly = originalCard.metadata?.nameOnly;

        if (!isNameOnly) {
          // We have a real price — show the card
          originalCard.title = `Original: ${originalCard.title}`;
          originalCard.metadata = { ...originalCard.metadata, isOriginal: true };
          send("card", originalCard);
          allCards.push(originalCard);
        } else {
          // No price, but we got the product name — use it for search
          send("narration", { text: `Identified: "${productName.slice(0, 80)}" — searching prices...` });
        }
      }

      // ── STEP 2: Find the same product on other retailers ──────────
      send("narration", { text: "Searching for this product on other retailers..." });

      // Perplexity finds URLs — pass product name for better results
      const retailerLinks = await findRetailerLinks(productUrl, productName || undefined);

      if (retailerLinks.length > 0) {
        send("narration", {
          text: `Found on ${retailerLinks.map((l) => l.retailer).join(", ")} — scraping live prices...`,
        });
      }

      // ── STEP 3: Scrape each retailer URL in parallel ──────────────
      if (retailerLinks.length > 0) {
        const scrapeResults = await Promise.allSettled(
          retailerLinks.map(async (link) => {
            // Try Bright Data structured scraper first
            let card = await scrapeOriginalProduct(link.url);

            // Fall back to Browserbase AI browser
            if (!card) {
              card = await scrapeProductPage(link.url);
            }

            // Skip name-only cards (no price extracted)
            if (card?.metadata?.nameOnly) card = null;

            if (card) {
              card.metadata = { ...card.metadata, retailer: link.retailer };
              const price = card.metadata?.price;
              if (typeof price === "number" && price > 0) {
                card.title = `${link.retailer}: $${price.toFixed(2)}`;
              }
            }

            return card;
          })
        );

        for (const result of scrapeResults) {
          if (result.status === "fulfilled" && result.value) {
            send("card", result.value);
            allCards.push(result.value);
            await new Promise((r) => setTimeout(r, 300));
          }
        }
      }

      // ── STEP 3b: Fallback — if scraping found nothing, use Perplexity prices
      if (allCards.length <= 1) {
        send("narration", { text: "Using web search for additional prices..." });
        const fallbackCards = await priceSearch(productUrl);
        for (const card of fallbackCards) {
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

      // ── STEP 4: Compare and calculate savings ─────────────────────
      send("narration", { text: "Comparing prices..." });

      const prices = allCards
        .map((c) => ({
          id: c.id,
          retailer: (c.metadata?.retailer as string) || "Unknown",
          price: c.metadata?.price as number,
          verified: c.metadata?.verified as boolean,
          isOriginal: c.metadata?.isOriginal as boolean,
        }))
        .filter((p) => typeof p.price === "number" && p.price > 0);

      if (prices.length > 1) {
        prices.sort((a, b) => a.price - b.price);
        const cheapest = prices[0];
        const original = prices.find((p) => p.isOriginal);
        const savingsVsOriginal = original ? original.price - cheapest.price : 0;
        const spread = prices[prices.length - 1].price - cheapest.price;

        if (spread > 0) {
          const savingsCard: EvidenceCard = {
            id: uuidv4(),
            type: "alert",
            severity: savingsVsOriginal > 0 ? "safe" : "info",
            title: savingsVsOriginal > 0
              ? `Save $${savingsVsOriginal.toFixed(2)} vs original`
              : `Price range: $${spread.toFixed(2)} spread`,
            detail: `Best price: $${cheapest.price.toFixed(2)} at ${cheapest.retailer}${original ? ` (original: $${original.price.toFixed(2)} at ${original.retailer})` : ""}. ${prices.length} retailers compared.`,
            source: "Sentinel Price Agent",
            confidence: 0.95,
            connections: allCards.map((c) => c.id),
            metadata: { savings: spread, savingsVsOriginal, cheapestRetailer: cheapest.retailer, cheapestPrice: cheapest.price },
          };
          send("card", savingsCard);

          for (const card of allCards) {
            send("connection", {
              from: savingsCard.id,
              to: card.id,
              label: card.metadata?.isOriginal ? "original listing" : "alternative",
            });
          }
        }
      }

      const verifiedCount = allCards.filter((c) => c.metadata?.verified).length;
      const source = verifiedCount > 0
        ? `${verifiedCount} verified via live scraping, ${prices.length - verifiedCount} from web search.`
        : "Prices sourced via web search.";
      send("narration", {
        text: `Compared ${prices.length} prices. ${source}`,
      });

      send("done", { summary: `Found ${prices.length} prices` });
    } catch (error) {
      console.error("Compare error:", error);
      send("error", { message: "Price comparison failed" });
    } finally {
      close();
    }
  })();

  return response;
}
