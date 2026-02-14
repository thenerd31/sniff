import { NextRequest } from "next/server";
import { createSSEResponse } from "@/lib/stream";
import { understandQuery } from "@/lib/tools/queryUnderstand";
import { searchProducts } from "@/lib/tools/serpSearch";
import { runFraudChecks } from "@/lib/tools/fraudCheck";
import type { ProductResult, ProductVerdict } from "@/types";

// ── POST /api/search ────────────────────────────────────────────────────
// The main shopping agent endpoint.
//
// Input:  { query?: string, image?: string (base64), url?: string }
// Output: SSE stream of events:
//   narration  → status updates for the UI
//   product    → a product result (card appears on screen)
//   fraud_check → individual fraud check result for a product
//   verdict    → final trust verdict for a product
//   all_products → signal that all products have been found
//   best_pick  → the crowned best deal
//   done       → pipeline complete
//   error      → something went wrong

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { query, image, url } = body as {
    query?: string;
    image?: string;
    url?: string;
  };

  if (!query && !image && !url) {
    return new Response(JSON.stringify({ error: "Provide query, image, or url" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { send, close, response } = createSSEResponse();

  (async () => {
    try {
      // ════════════════════════════════════════════════════════════════
      // PHASE 1: UNDERSTAND
      // ════════════════════════════════════════════════════════════════
      send("narration", { text: "Understanding your request..." });

      let searchQueries: string[];
      let productName: string;

      if (url) {
        // URL input → scrape the page to identify the product, then search
        send("narration", { text: "Analyzing product page..." });

        // Fetch the page title + meta description to identify the product
        let pageContext = url;
        try {
          const pageRes = await fetch(url, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              Accept: "text/html",
            },
            redirect: "follow",
            signal: AbortSignal.timeout(10000),
          });
          const html = await pageRes.text();
          const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
          const ogTitle = html.match(/property=["']og:title["']\s+content=["']([^"']+)["']/i);
          const ogDesc = html.match(/property=["']og:description["']\s+content=["']([^"']+)["']/i);
          const metaDesc = html.match(/name=["']description["']\s+content=["']([^"']+)["']/i);

          const title = ogTitle?.[1] || titleMatch?.[1]?.trim() || "";
          const desc = ogDesc?.[1] || metaDesc?.[1] || "";
          pageContext = `Product: ${title}. ${desc}`.slice(0, 500);
        } catch {
          // If scraping fails, fall back to the URL itself
        }

        const understanding = await understandQuery({
          query: `Find this product and alternatives: ${pageContext}`,
        });
        searchQueries = understanding.searchQueries;
        productName = understanding.productName;
      } else {
        const understanding = await understandQuery({ query, image });
        searchQueries = understanding.searchQueries;
        productName = understanding.productName;
      }

      send("narration", {
        text: `Searching for "${productName}"${url ? ` (from ${new URL(url).hostname})` : ""}...`,
      });

      // ════════════════════════════════════════════════════════════════
      // PHASE 2: SEARCH
      // ════════════════════════════════════════════════════════════════
      send("narration", { text: "Searching across retailers..." });

      const products = await searchProducts(searchQueries);

      if (products.length === 0) {
        send("narration", { text: "No products found. Try a different search." });
        send("done", {
          summary: "No products found",
          totalProducts: 0,
          trustedCount: 0,
          flaggedCount: 0,
        });
        return;
      }

      // Stream products to frontend as they arrive
      for (const product of products) {
        send("product", product);
        await new Promise((r) => setTimeout(r, 150)); // stagger for visual effect
      }

      send("all_products", { count: products.length });
      send("narration", {
        text: `Found ${products.length} results. Running security checks...`,
      });

      // ════════════════════════════════════════════════════════════════
      // PHASE 3: FRAUD DETECTION
      // ════════════════════════════════════════════════════════════════
      // Run fraud checks on ALL products in parallel.
      // Each individual check result is streamed to the frontend
      // as it completes (the visual spectacle).

      const verdicts = new Map<
        string,
        { verdict: ProductVerdict; trustScore: number }
      >();

      await Promise.allSettled(
        products.map(async (product) => {
          const result = await runFraudChecks(
            product,
            (productId, check) => {
              send("fraud_check", { productId, check });
            },
            products, // pass all products for price anomaly detection
          );

          verdicts.set(product.id, {
            verdict: result.verdict,
            trustScore: result.trustScore,
          });

          send("verdict", {
            productId: product.id,
            verdict: result.verdict,
            trustScore: result.trustScore,
          });
        })
      );

      // ════════════════════════════════════════════════════════════════
      // PHASE 4 + 5: SPLIT, SORT, CROWN
      // ════════════════════════════════════════════════════════════════
      // The frontend handles the visual split/sort/crown animation.
      // We just need to tell it which product is the best pick.

      const trustedProducts: Array<ProductResult & { trustScore: number }> = [];
      let flaggedCount = 0;

      for (const product of products) {
        const v = verdicts.get(product.id);
        if (!v) continue;

        if (v.verdict === "danger") {
          flaggedCount++;
        } else {
          trustedProducts.push({ ...product, trustScore: v.trustScore });
        }
      }

      // Sort trusted products by price (ascending)
      trustedProducts.sort((a, b) => a.price - b.price);

      // Crown the best deal (cheapest trusted product)
      if (trustedProducts.length > 0) {
        const bestPick = trustedProducts[0];
        const avgPrice =
          trustedProducts.reduce((sum, p) => sum + p.price, 0) /
          trustedProducts.length;
        const savings = avgPrice > bestPick.price
          ? Math.round((avgPrice - bestPick.price) * 100) / 100
          : undefined;

        send("best_pick", {
          productId: bestPick.id,
          savings,
        });

        send("narration", {
          text: `Best deal: $${bestPick.price.toFixed(2)} at ${bestPick.retailer}${savings ? ` — $${savings.toFixed(2)} below average` : ""}. ${flaggedCount > 0 ? `${flaggedCount} result${flaggedCount > 1 ? "s" : ""} flagged as suspicious.` : "All results verified safe."}`,
        });
      } else {
        send("narration", {
          text: "All results were flagged as suspicious. Try a more specific search or check well-known retailers directly.",
        });
      }

      send("done", {
        summary: "Search complete",
        totalProducts: products.length,
        trustedCount: trustedProducts.length,
        flaggedCount,
      });
    } catch (error) {
      console.error("Search pipeline error:", error);
      send("error", {
        message: error instanceof Error ? error.message : "Search failed",
      });
    } finally {
      close();
    }
  })();

  return response;
}
