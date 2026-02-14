import { NextRequest } from "next/server";
import { createSSEResponse } from "@/lib/stream";
import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";
import { whoisLookup } from "@/lib/tools/whois";
import { safeBrowsingCheck } from "@/lib/tools/safe-browsing";
import { sslAnalysis } from "@/lib/tools/ssl";
import { redditSearch } from "@/lib/tools/reddit";
import { scrapeForRedFlags } from "@/lib/tools/scraper";
import { scamadviserCheck } from "@/lib/tools/scamadviser";
import { webSearch } from "@/lib/tools/webSearch";
import { brandImpersonationCheck } from "@/lib/tools/brand-impersonation";
import { calcIncrementalScore, computeFinalThreatScore } from "@/lib/scoring";
import { createInvestigation, addCards, updateThreatScore } from "@/lib/investigationStore";
import { scrapeOriginalProduct } from "@/lib/tools/brightdata";
import { scrapeProductPage } from "@/lib/tools/browserbase";
import { findRetailerLinks, priceSearch } from "@/lib/tools/priceSearch";
import { isHighAuthorityDomain } from "@/lib/known-domains";
import type { EvidenceCard } from "@/types";

const openai = new OpenAI();

// ── Known retailer domains (if the URL is one of these, it's a product page) ──
const RETAILER_DOMAINS = new Set([
  "amazon.com", "walmart.com", "target.com", "bestbuy.com", "ebay.com",
  "costco.com", "newegg.com", "bhphotovideo.com", "homedepot.com",
  "lowes.com", "macys.com", "nordstrom.com", "zappos.com", "wayfair.com",
  "etsy.com", "aliexpress.com", "wish.com", "overstock.com",
  "apple.com", "samsung.com", "nike.com", "adidas.com",
]);

function isRetailerUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    if (RETAILER_DOMAINS.has(host)) return true;
    // Check root domain: smile.amazon.com → amazon.com
    const parts = host.split(".");
    if (parts.length > 2) {
      const root = parts.slice(-2).join(".");
      if (RETAILER_DOMAINS.has(root)) return true;
    }
    return false;
  } catch {
    return false;
  }
}

// ── Synthesis Prompt ──────────────────────────────────────────────────────
const SYNTHESIS_PROMPT = `You are Sentinel, an AI fraud investigation analyst. You have been given evidence cards from an automated scan of a URL. Your job is to ANALYZE the evidence and provide:

1. CONNECTIONS: Identify which evidence cards are related and why. Return pairs of card IDs with a short label explaining the relationship.
   - Example: Domain is 5 days old + Reddit scam reports → "corroborating fraud evidence"
   - Example: SSL mismatch + no return policy → "multiple trust failures"
   - Create at least 3-5 connections. More connections = better investigation board.

2. ADDITIONAL INSIGHTS: Generate 1-3 extra evidence cards for things YOU notice that the tools missed:
   - Patterns across findings (e.g. "3 out of 6 checks flagged this site")
   - Meta-observations (e.g. "This matches a known dropshipping scam pattern")
   - Actionable advice (e.g. "Do not enter payment information on this site")

3. PRODUCT IDENTIFICATION: If this appears to be a product/shopping page (scam OR legit), identify what the product is.
   Return the product name so we can find it on legitimate retailers.

4. NARRATION: A 2-3 sentence summary a non-technical person would understand.

DO NOT include a threatScore — it is computed separately.

Respond with valid JSON matching this exact schema:
{
  "connections": [
    { "from": "card-id-1", "to": "card-id-2", "label": "short explanation" }
  ],
  "additionalCards": [
    {
      "type": "alert|business|seller|scam_report",
      "severity": "critical|warning|info|safe",
      "title": "Short headline",
      "detail": "Detailed explanation",
      "source": "Sentinel AI Analysis",
      "confidence": 0.85,
      "connectTo": ["card-id-to-link-to"]
    }
  ],
  "productName": "Product name if detected, or null",
  "narration": "2-3 sentence plain English summary"
}`;

// ── Price comparison logic (shared between scam-alt and legit-compare) ──
async function runPriceComparison(
  productUrl: string,
  productName: string | null,
  send: (event: string, data: unknown) => void,
): Promise<EvidenceCard[]> {
  const priceCards: EvidenceCard[] = [];

  // Step 1: Try to scrape the original URL for its price
  let originalCard = await scrapeOriginalProduct(productUrl);
  if (!originalCard) {
    originalCard = await scrapeProductPage(productUrl);
  }

  if (originalCard && !originalCard.metadata?.nameOnly) {
    originalCard.title = `Original: ${originalCard.title}`;
    originalCard.metadata = { ...originalCard.metadata, isOriginal: true };
    send("card", originalCard);
    priceCards.push(originalCard);
    if (!productName) {
      productName = originalCard.detail?.split(" — ")[0] || originalCard.title;
    }
  } else if (originalCard?.metadata?.nameOnly && !productName) {
    productName = originalCard.detail?.split(" — ")[0] || originalCard.title || "";
  }

  // Step 2: Find the same product on other retailers
  const retailerLinks = await findRetailerLinks(productUrl, productName || undefined);

  if (retailerLinks.length > 0) {
    send("narration", {
      text: `Found on ${retailerLinks.map((l) => l.retailer).join(", ")} — scraping live prices...`,
    });

    // Step 3: Scrape each retailer URL in parallel
    const scrapeResults = await Promise.allSettled(
      retailerLinks.map(async (link) => {
        let card = await scrapeOriginalProduct(link.url);
        if (!card) card = await scrapeProductPage(link.url);
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
        priceCards.push(result.value);
        await new Promise((r) => setTimeout(r, 300));
      }
    }
  }

  // Fallback: Perplexity prices if scraping found nothing
  if (priceCards.length <= 1) {
    const fallbackCards = await priceSearch(productUrl);
    for (const card of fallbackCards) {
      send("card", card);
      priceCards.push(card);
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  return priceCards;
}

function emitSavingsCard(
  priceCards: EvidenceCard[],
  send: (event: string, data: unknown) => void,
) {
  const prices = priceCards
    .map((c) => ({
      id: c.id,
      retailer: (c.metadata?.retailer as string) || "Unknown",
      price: c.metadata?.price as number,
      isOriginal: c.metadata?.isOriginal as boolean,
    }))
    .filter((p) => typeof p.price === "number" && p.price > 0);

  if (prices.length <= 1) return;

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
        ? `Save $${savingsVsOriginal.toFixed(2)} at ${cheapest.retailer}`
        : `Best price: $${cheapest.price.toFixed(2)} at ${cheapest.retailer}`,
      detail: `${prices.length} retailers compared. ${original ? `Original: $${original.price.toFixed(2)} at ${original.retailer}.` : ""} Best deal: $${cheapest.price.toFixed(2)} at ${cheapest.retailer}.`,
      source: "Sentinel Price Agent",
      confidence: 0.95,
      connections: priceCards.map((c) => c.id),
      metadata: { savings: spread, savingsVsOriginal, cheapestRetailer: cheapest.retailer, cheapestPrice: cheapest.price },
    };
    send("card", savingsCard);

    for (const card of priceCards) {
      send("connection", {
        from: savingsCard.id,
        to: card.id,
        label: card.metadata?.isOriginal ? "original listing" : "better deal",
      });
    }
  }
}

// ── Unified Route Handler ────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { url } = await req.json();
  const { send, close, response } = createSSEResponse();

  (async () => {
    try {
      const domain = new URL(url).hostname;
      const investigationId = uuidv4();
      createInvestigation(investigationId, url);

      const isKnownRetailer = isRetailerUrl(url);
      const isKnownSafe = isHighAuthorityDomain(domain);
      const allCards: EvidenceCard[] = [];

      // ════════════════════════════════════════════════════════════════
      // PATH A: Known retailer / safe domain → skip fraud scan, go
      //         straight to price comparison
      // ════════════════════════════════════════════════════════════════
      if (isKnownRetailer && isKnownSafe) {
        send("narration", { text: "Recognized retailer — checking if you're getting the best deal..." });
        send("threat_score", { score: 0 });

        const priceCards = await runPriceComparison(url, null, send);
        allCards.push(...priceCards);
        emitSavingsCard(priceCards, send);

        const verifiedCount = priceCards.filter((c) => c.metadata?.verified).length;
        send("narration", {
          text: priceCards.length > 1
            ? `Compared ${priceCards.length} prices${verifiedCount > 0 ? ` (${verifiedCount} verified via live scraping)` : ""}. This is a legitimate retailer.`
            : "This is a legitimate retailer. Could not find alternative prices.",
        });

        send("done", { summary: "Price comparison complete", investigationId });
        return;
      }

      // ════════════════════════════════════════════════════════════════
      // PATH B: Unknown site → full investigation, then decide
      // ════════════════════════════════════════════════════════════════

      // ── PHASE 1: Parallel tool scan ──────────────────────────────
      send("narration", { text: "Starting investigation..." });
      let liveScore = 0;

      const toolPromises = [
        { name: "WHOIS Lookup", fn: () => whoisLookup(url) },
        { name: "SSL Analysis", fn: () => sslAnalysis(url) },
        { name: "Google Safe Browsing", fn: () => safeBrowsingCheck(url) },
        { name: "Brand Check", fn: () => brandImpersonationCheck(url) },
        { name: "Reddit Search", fn: () => redditSearch(url) },
        { name: "Page Scanner", fn: () => scrapeForRedFlags(url) },
        { name: "ScamAdviser", fn: () => scamadviserCheck(url) },
        { name: "Web Research", fn: () => webSearch(url) },
      ];

      await Promise.allSettled(
        toolPromises.map(async (tool) => {
          send("narration", { text: `Running ${tool.name}...` });
          try {
            const result = await tool.fn();
            const cards = Array.isArray(result) ? result : [result];
            for (const card of cards) {
              send("card", card);
              allCards.push(card);
              liveScore = calcIncrementalScore(liveScore, card);
              send("threat_score", { score: liveScore });
              await new Promise((r) => setTimeout(r, 300));
            }
          } catch (error) {
            console.error(`${tool.name} failed:`, error);
          }
        })
      );

      if (allCards.length === 0) {
        send("error", { message: "All investigation tools failed" });
        close();
        return;
      }

      // ── Compute final threat score ──
      const finalScore = computeFinalThreatScore(allCards, url);
      send("threat_score", { score: finalScore });
      addCards(investigationId, allCards);
      updateThreatScore(investigationId, finalScore);

      // ── PHASE 2: Agent synthesis ─────────────────────────────────
      send("narration", { text: "Analyzing evidence..." });

      const cardSummary = allCards
        .map((c) => `[ID: ${c.id}] [${c.severity.toUpperCase()}] ${c.title}: ${c.detail} (source: ${c.source}, confidence: ${c.confidence})`)
        .join("\n");

      let productName: string | null = null;

      const synthesisResult = await openai.responses.create({
        model: "gpt-4o",
        instructions: SYNTHESIS_PROMPT,
        input: `URL investigated: ${url} (domain: ${domain})\nFinal threat score: ${finalScore}/100\n\nEvidence cards from automated scan:\n${cardSummary}`,
      });

      const textOutput = synthesisResult.output.find((item) => item.type === "message");
      if (textOutput && textOutput.type === "message") {
        const textContent = textOutput.content.find((c) => c.type === "output_text");
        if (textContent && textContent.type === "output_text") {
          try {
            const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("No JSON found");
            const synthesis = JSON.parse(jsonMatch[0]);

            // Stream connections
            if (Array.isArray(synthesis.connections)) {
              for (const conn of synthesis.connections) {
                send("connection", { from: conn.from, to: conn.to, label: conn.label });
                await new Promise((r) => setTimeout(r, 200));
              }
            }

            // Stream additional insight cards
            if (Array.isArray(synthesis.additionalCards)) {
              for (const cardData of synthesis.additionalCards) {
                const id = `insight-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
                const card: EvidenceCard = {
                  id,
                  type: (cardData.type || "alert") as EvidenceCard["type"],
                  severity: (cardData.severity || "info") as EvidenceCard["severity"],
                  title: cardData.title,
                  detail: cardData.detail,
                  source: cardData.source || "Sentinel AI Analysis",
                  confidence: cardData.confidence || 0.8,
                  connections: cardData.connectTo || [],
                  metadata: { agentGenerated: true },
                };
                send("card", card);
                allCards.push(card);

                if (Array.isArray(cardData.connectTo)) {
                  for (const targetId of cardData.connectTo) {
                    send("connection", { from: id, to: targetId });
                  }
                }
                await new Promise((r) => setTimeout(r, 500));
              }
            }

            // Stream narration
            if (synthesis.narration) {
              send("narration", { text: synthesis.narration });
            }

            // Capture product name for Phase 3
            if (synthesis.productName && synthesis.productName !== "null") {
              productName = synthesis.productName;
            }
          } catch (parseError) {
            console.error("Failed to parse synthesis:", parseError);
            send("narration", { text: textContent.text });
          }
        }
      }

      // ── PHASE 3: The Turn ────────────────────────────────────────
      // If it's dangerous → find legitimate alternatives
      // If it's safe + product → find better prices
      // If it's safe + not a product → done

      const isDangerous = finalScore >= 50;
      const isProduct = isKnownRetailer || !!productName;

      if (isDangerous && isProduct) {
        // ── THE WOW MOMENT: "This is a scam. Here's where to buy it for real." ──
        send("narration", { text: "This site appears fraudulent. Finding legitimate alternatives..." });

        const priceCards = await runPriceComparison(url, productName, send);
        allCards.push(...priceCards);
        emitSavingsCard(priceCards, send);

        if (priceCards.length > 0) {
          send("narration", {
            text: `Found ${priceCards.length} legitimate retailers selling this product. Don't buy from the original site.`,
          });
        }
      } else if (isDangerous && !isProduct) {
        // Dangerous but not a product — just warn
        send("narration", {
          text: "This site shows significant fraud indicators. Do not enter any personal or payment information.",
        });
      } else if (!isDangerous && isProduct) {
        // Safe product page — compare prices
        send("narration", { text: "Site looks legitimate. Checking if you're getting the best deal..." });

        const priceCards = await runPriceComparison(url, productName, send);
        allCards.push(...priceCards);
        emitSavingsCard(priceCards, send);

        if (priceCards.length > 1) {
          const verifiedCount = priceCards.filter((c) => c.metadata?.verified).length;
          send("narration", {
            text: `Compared ${priceCards.length} prices${verifiedCount > 0 ? ` (${verifiedCount} verified)` : ""}. Check the board for the best deal.`,
          });
        }
      }
      // else: safe + not a product → investigation is complete, nothing more to do

      send("done", { summary: "Investigation complete", investigationId });
    } catch (error) {
      console.error("Investigation error:", error);
      send("error", { message: "Investigation failed" });
    } finally {
      close();
    }
  })();

  return response;
}
