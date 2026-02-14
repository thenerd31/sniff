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
import type { EvidenceCard } from "@/types";

const openai = new OpenAI();

// ── Phase 2: Agent Synthesis Prompt ────────────────────────────────────
const SYNTHESIS_PROMPT = `You are Sentinel, an AI fraud investigation analyst. You have been given evidence cards from an automated scan of a URL. Your job is to ANALYZE the evidence and provide:

1. CONNECTIONS: Identify which evidence cards are related and why. Return pairs of card IDs with a short label explaining the relationship.
   - Example: Domain is 5 days old + Reddit scam reports → "corroborating fraud evidence"
   - Example: SSL mismatch + no return policy → "multiple trust failures"
   - Create at least 3-5 connections. More connections = better investigation board.

2. ADDITIONAL INSIGHTS: Generate 1-3 extra evidence cards for things YOU notice that the tools missed:
   - Patterns across findings (e.g. "3 out of 6 checks flagged this site")
   - Meta-observations (e.g. "This matches a known dropshipping scam pattern")
   - Actionable advice (e.g. "Do not enter payment information on this site")

3. NARRATION: A 2-3 sentence summary a non-technical person would understand.

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
  "narration": "2-3 sentence plain English summary"
}`;

// ── Route Handler ──────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { url } = await req.json();
  const { send, close, response } = createSSEResponse();

  (async () => {
    try {
      const domain = new URL(url).hostname;
      const investigationId = uuidv4();
      createInvestigation(investigationId, url);

      // ── PHASE 1: Run all tools in parallel, stream cards as they resolve ──
      send("narration", { text: "Starting investigation..." });

      const allCards: EvidenceCard[] = [];
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

      // Execute all tools in parallel, stream each result as it arrives
      await Promise.allSettled(
        toolPromises.map(async (tool) => {
          send("narration", { text: `Running ${tool.name}...` });
          try {
            const result = await tool.fn();
            const cards = Array.isArray(result) ? result : [result];
            for (const card of cards) {
              send("card", card);
              allCards.push(card);
              // Stream incremental threat score for live UX
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

      // ── Critical Veto: compute final threat score ──
      const finalScore = computeFinalThreatScore(allCards, url);
      send("threat_score", { score: finalScore });

      // Store cards and score for multi-turn
      addCards(investigationId, allCards);
      updateThreatScore(investigationId, finalScore);

      // ── PHASE 2: Agent synthesizes connections + insights ──
      send("narration", { text: "Analyzing evidence..." });

      const cardSummary = allCards
        .map((c) => `[ID: ${c.id}] [${c.severity.toUpperCase()}] ${c.title}: ${c.detail} (source: ${c.source}, confidence: ${c.confidence})`)
        .join("\n");

      const synthesisResult = await openai.responses.create({
        model: "gpt-4o",
        instructions: SYNTHESIS_PROMPT,
        input: `URL investigated: ${url} (domain: ${domain})\nFinal threat score: ${finalScore}/100\n\nEvidence cards from automated scan:\n${cardSummary}`,
      });

      // Parse the structured response
      const textOutput = synthesisResult.output.find((item) => item.type === "message");
      if (textOutput && textOutput.type === "message") {
        const textContent = textOutput.content.find((c) => c.type === "output_text");
        if (textContent && textContent.type === "output_text") {
          try {
            const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("No JSON found");
            const synthesis = JSON.parse(jsonMatch[0]);

            // Stream connections (the red strings)
            if (Array.isArray(synthesis.connections)) {
              for (const conn of synthesis.connections) {
                send("connection", { from: conn.from, to: conn.to, label: conn.label });
                await new Promise((r) => setTimeout(r, 200));
              }
            }

            // Stream additional insight cards from the agent
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
          } catch (parseError) {
            console.error("Failed to parse synthesis:", parseError);
            send("narration", { text: textContent.text });
          }
        }
      }

      send("done", { summary: `Investigation complete`, investigationId });
    } catch (error) {
      console.error("Investigation error:", error);
      send("error", { message: "Investigation failed" });
    } finally {
      close();
    }
  })();

  return response;
}
