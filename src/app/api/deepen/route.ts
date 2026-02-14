import { NextRequest } from "next/server";
import { createSSEResponse } from "@/lib/stream";
import OpenAI from "openai";
import { whoisLookup } from "@/lib/tools/whois";
import { safeBrowsingCheck } from "@/lib/tools/safe-browsing";
import { sslAnalysis } from "@/lib/tools/ssl";
import { redditSearch } from "@/lib/tools/reddit";
import { scrapeForRedFlags } from "@/lib/tools/scraper";
import { scamadviserCheck } from "@/lib/tools/scamadviser";
import { priceSearch } from "@/lib/tools/priceSearch";
import type { EvidenceCard } from "@/types";

const openai = new OpenAI();

// ── Focus-specific tool mappings ───────────────────────────────────────
// Each focus area runs specific tools — no agent needed to decide
const FOCUS_TOOLS: Record<string, { name: string; fn: (url: string) => Promise<EvidenceCard | EvidenceCard[]> }[]> = {
  seller: [
    { name: "WHOIS Deep Dive", fn: whoisLookup },
    { name: "Reddit (seller reports)", fn: redditSearch },
    { name: "ScamAdviser", fn: scamadviserCheck },
  ],
  reviews: [
    { name: "Reddit (reviews)", fn: redditSearch },
    { name: "ScamAdviser", fn: scamadviserCheck },
    { name: "Page Scanner", fn: scrapeForRedFlags },
  ],
  business: [
    { name: "WHOIS (business info)", fn: whoisLookup },
    { name: "ScamAdviser", fn: scamadviserCheck },
  ],
  alternatives: [
    { name: "Price Search", fn: priceSearch },
  ],
  price_history: [
    { name: "Price Search", fn: priceSearch },
    { name: "Page Scanner", fn: scrapeForRedFlags },
  ],
};

// ── Focus-specific synthesis prompts ───────────────────────────────────
const FOCUS_PROMPTS: Record<string, string> = {
  seller: "Focus your analysis on seller legitimacy. Look for shell company indicators, ownership concealment, and connections to known fraud patterns.",
  reviews: "Focus your analysis on review authenticity. Look for fake review patterns, astroturfing, and whether user complaints describe real scam experiences.",
  business: "Focus your analysis on business legitimacy. Look for corporate registration gaps, virtual office indicators, and entity verification failures.",
  alternatives: "Focus on identifying legitimate alternatives. Compare pricing and highlight which retailers are trustworthy.",
  price_history: "Focus on pricing legitimacy. Look for artificial inflation, fake discounts, and too-good-to-be-true pricing patterns.",
};

// ── Synthesis Prompt ───────────────────────────────────────────────────
function buildSynthesisPrompt(focus: string, existingCards: EvidenceCard[]): string {
  const focusInstruction = FOCUS_PROMPTS[focus] || "Analyze the new evidence in context of existing findings.";

  return `You are Sentinel, continuing a fraud investigation. The user clicked "Dig Deeper" on "${focus}".

EXISTING EVIDENCE (already on the board):
${existingCards.map((c) => `[ID: ${c.id}] [${c.severity.toUpperCase()}] ${c.title}: ${c.detail}`).join("\n")}

NEW EVIDENCE (just gathered):
These will be provided below.

${focusInstruction}

Respond with valid JSON:
{
  "connections": [
    { "from": "new-card-id", "to": "existing-card-id", "label": "relationship" }
  ],
  "additionalCards": [
    {
      "type": "alert|business|seller|scam_report",
      "severity": "critical|warning|info|safe",
      "title": "Short headline",
      "detail": "Detailed explanation",
      "source": "Sentinel AI Analysis",
      "confidence": 0.85,
      "connectTo": ["card-ids-to-link-to"]
    }
  ],
  "threatScore": 75,
  "threatReasoning": "Updated assessment considering ALL evidence (old + new)",
  "narration": "2-3 sentence summary of what the deeper investigation revealed"
}

IMPORTANT: Connect NEW cards to EXISTING cards where evidence reinforces or contradicts. This is what makes the investigation board powerful — showing how deeper investigation connects to initial findings.`;
}

// ── Route Handler ──────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { focus, existingCards, url } = await req.json();
  const { send, close, response } = createSSEResponse();

  (async () => {
    try {
      const domain = new URL(url).hostname;
      const existing: EvidenceCard[] = existingCards || [];
      const toolsToRun = FOCUS_TOOLS[focus] || FOCUS_TOOLS.seller;

      // ── PHASE 1: Run focus-specific tools, stream cards ──
      send("narration", { text: `Digging deeper into ${focus}...` });

      const newCards: EvidenceCard[] = [];

      await Promise.allSettled(
        toolsToRun.map(async (tool) => {
          send("narration", { text: `Running ${tool.name}...` });
          try {
            const result = await tool.fn(url);
            const cards = Array.isArray(result) ? result : [result];
            for (const card of cards) {
              send("card", card);
              newCards.push(card);
              await new Promise((r) => setTimeout(r, 300));
            }
          } catch (error) {
            console.error(`${tool.name} failed:`, error);
          }
        })
      );

      if (newCards.length === 0) {
        send("error", { message: "Deeper investigation tools failed" });
        close();
        return;
      }

      // ── PHASE 2: Agent synthesizes with ALL evidence (old + new) ──
      send("narration", { text: "Cross-referencing with existing evidence..." });

      const newCardSummary = newCards
        .map((c) => `[ID: ${c.id}] [${c.severity.toUpperCase()}] ${c.title}: ${c.detail} (source: ${c.source})`)
        .join("\n");

      const synthesisPrompt = buildSynthesisPrompt(focus, existing);

      const synthesisResult = await openai.responses.create({
        model: "gpt-5-mini",
        instructions: synthesisPrompt,
        input: `New evidence from "${focus}" investigation:\n${newCardSummary}`,
      });

      const textOutput = synthesisResult.output.find((item) => item.type === "message");
      if (textOutput && textOutput.type === "message") {
        const textContent = textOutput.content.find((c) => c.type === "output_text");
        if (textContent && textContent.type === "output_text") {
          try {
            const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("No JSON found");
            const synthesis = JSON.parse(jsonMatch[0]);

            // Stream connections (red strings between new and old cards)
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
                if (Array.isArray(cardData.connectTo)) {
                  for (const targetId of cardData.connectTo) {
                    send("connection", { from: id, to: targetId });
                  }
                }
                await new Promise((r) => setTimeout(r, 500));
              }
            }

            if (typeof synthesis.threatScore === "number") {
              send("threat_score", { score: synthesis.threatScore });
            }
            if (synthesis.narration) {
              send("narration", { text: synthesis.narration });
            }
            if (synthesis.threatReasoning) {
              send("narration", { text: `Updated assessment: ${synthesis.threatReasoning}` });
            }
          } catch (parseError) {
            console.error("Failed to parse synthesis:", parseError);
            send("narration", { text: textContent.text });
          }
        }
      }

      send("done", { summary: `Deepened investigation: ${focus}` });
    } catch (error) {
      console.error("Deepen error:", error);
      send("error", { message: "Failed to deepen investigation" });
    } finally {
      close();
    }
  })();

  return response;
}
