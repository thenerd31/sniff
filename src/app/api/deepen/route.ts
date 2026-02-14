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

// ── Focus-Specific Prompts ─────────────────────────────────────────────
const FOCUS_PROMPTS: Record<string, string> = {
  seller: `Focus on SELLER INVESTIGATION:
- Search for the seller/company behind this domain
- Look for business registration, shell company indicators
- Check for multiple domains registered by the same entity
- Search Reddit for complaints about this seller
- Emit 3-5 NEW evidence cards about seller legitimacy`,

  reviews: `Focus on REVIEW ANALYSIS:
- Search for reviews of this website/store
- Look for patterns of fake reviews (similar language, posted in bursts)
- Check if review scores seem manipulated
- Search Reddit for real user experiences
- Emit 3-5 NEW evidence cards about review authenticity`,

  business: `Focus on BUSINESS VERIFICATION:
- Search for corporate registration records
- Look for physical address verification
- Check for shell company indicators (registered agent, virtual office)
- Verify contact information (phone, email domain)
- Emit 3-5 NEW evidence cards about business legitimacy`,

  alternatives: `Focus on FINDING LEGITIMATE ALTERNATIVES:
- Identify what product/service this site sells
- Find legitimate, well-known retailers selling the same thing
- Compare pricing between legitimate options
- Emit 3-5 evidence cards with severity "safe" for legitimate alternatives`,

  price_history: `Focus on PRICE ANALYSIS:
- Research the typical price for this product
- Check if the listed price is too good to be true
- Look for artificial urgency (fake countdown timers, limited stock claims)
- Compare with retail prices at major stores
- Emit 3-5 NEW evidence cards about pricing legitimacy`,
};

function buildDeepenPrompt(focus: string, existingCards: EvidenceCard[]): string {
  const existingSummary = existingCards
    .map((c) => `- [${c.severity.toUpperCase()}] ${c.title}: ${c.detail} (cardId: ${c.id})`)
    .join("\n");

  const existingIds = existingCards.map((c) => c.id).join(", ");
  const focusInstructions = FOCUS_PROMPTS[focus] || `Investigate further in the area of: ${focus}`;

  return `You are Sentinel, continuing an existing fraud investigation. The user wants to dig deeper.

EXISTING EVIDENCE (already on the board):
${existingSummary}

EXISTING CARD IDS (use these in connectTo to link new cards to old ones): ${existingIds}

${focusInstructions}

RULES:
- Emit ONLY NEW findings. Do NOT repeat existing evidence.
- Connect new cards to existing ones where relevant using connectTo.
- Update the threat score based on ALL evidence (old + new).
- Be specific with dates, numbers, sources.`;
}

// ── Tool Definition Helper ──────────────────────────────────────────────
function defineTool(name: string, description: string, parameters?: Record<string, unknown>): OpenAI.Responses.Tool {
  return {
    type: "function" as const,
    name,
    description,
    strict: false as const,
    parameters: parameters || {
      type: "object" as const,
      properties: { url: { type: "string" as const } },
      required: ["url"] as const,
      additionalProperties: false as const,
    },
  };
}

// ── Tool Definitions ───────────────────────────────────────────────────
const tools: OpenAI.Responses.Tool[] = [
  defineTool("whois_lookup", "WHOIS lookup on the domain."),
  defineTool("ssl_analysis", "Analyze SSL/TLS certificate."),
  defineTool("safe_browsing_check", "Check against Google Safe Browsing."),
  defineTool("scrape_red_flags", "Scrape webpage for scam red flags."),
  defineTool("reddit_search", "Search Reddit for reports about this domain."),
  defineTool("scamadviser_check", "Query ScamAdviser for trust score."),
  defineTool("price_search", "Search for product prices across legitimate retailers."),
  defineTool("emit_evidence_card", "Pin an evidence card to the board.", {
    type: "object" as const,
    properties: {
      type: { type: "string" as const, enum: ["domain", "ssl", "scam_report", "review_analysis", "price", "seller", "business", "alert", "email", "alternative"] },
      severity: { type: "string" as const, enum: ["critical", "warning", "info", "safe"] },
      title: { type: "string" as const },
      detail: { type: "string" as const },
      source: { type: "string" as const },
      confidence: { type: "number" as const },
      connectTo: { type: "array" as const, items: { type: "string" as const } },
    },
    required: ["type", "severity", "title", "detail", "source", "confidence"] as const,
    additionalProperties: false as const,
  }),
  defineTool("set_threat_score", "Update the overall threat score (0-100).", {
    type: "object" as const,
    properties: {
      score: { type: "number" as const },
      reasoning: { type: "string" as const },
    },
    required: ["score", "reasoning"] as const,
    additionalProperties: false as const,
  }),
];

// ── Tool Executor ──────────────────────────────────────────────────────
async function executeTool(
  name: string,
  args: Record<string, string>,
  send: (event: string, data: unknown) => void,
  cardIds: string[]
): Promise<string> {
  switch (name) {
    case "whois_lookup":
      return JSON.stringify(await whoisLookup(args.url));
    case "ssl_analysis":
      return JSON.stringify(await sslAnalysis(args.url));
    case "safe_browsing_check":
      return JSON.stringify(await safeBrowsingCheck(args.url));
    case "scrape_red_flags":
      return JSON.stringify(await scrapeForRedFlags(args.url));
    case "reddit_search":
      return JSON.stringify(await redditSearch(args.url));
    case "scamadviser_check":
      return JSON.stringify(await scamadviserCheck(args.url));
    case "price_search":
      return JSON.stringify(await priceSearch(args.url));
    case "emit_evidence_card": {
      const id = `card-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      cardIds.push(id);
      const card: EvidenceCard = {
        id,
        type: args.type as EvidenceCard["type"],
        severity: args.severity as EvidenceCard["severity"],
        title: args.title,
        detail: args.detail,
        source: args.source,
        confidence: parseFloat(args.confidence) || 0.5,
        connections: (Array.isArray(args.connectTo) ? args.connectTo : []) as string[],
        metadata: {},
      };
      send("card", card);
      if (Array.isArray(args.connectTo)) {
        for (const targetId of args.connectTo) {
          send("connection", { from: id, to: targetId });
        }
      }
      return JSON.stringify({ success: true, cardId: id });
    }
    case "set_threat_score": {
      send("threat_score", { score: parseFloat(args.score) || 0 });
      return JSON.stringify({ success: true });
    }
    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}

// ── Route Handler ──────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { focus, existingCards, url } = await req.json();
  const { send, close, response } = createSSEResponse();

  (async () => {
    try {
      const domain = new URL(url).hostname;
      const cardIds: string[] = (existingCards || []).map((c: EvidenceCard) => c.id);
      const systemPrompt = buildDeepenPrompt(focus, existingCards || []);

      let result = await openai.responses.create({
        model: "gpt-4o",
        instructions: systemPrompt,
        input: `Dig deeper into "${focus}" for URL: ${url} (domain: ${domain})`,
        tools,
      });

      const MAX_ITERATIONS = 8;
      for (let i = 0; i < MAX_ITERATIONS; i++) {
        const toolCalls = result.output.filter(
          (item) => item.type === "function_call"
        );

        if (toolCalls.length === 0) break;

        const toolResults: OpenAI.Responses.ResponseInputItem[] = [];

        for (const item of result.output) {
          if (item.type === "function_call") {
            toolResults.push({
              type: "function_call",
              id: item.id,
              call_id: item.call_id,
              name: item.name,
              arguments: item.arguments,
            });
          }
        }

        for (const call of toolCalls) {
          if (call.type !== "function_call") continue;

          send("narration", { text: `Running ${call.name.replace(/_/g, " ")}...` });

          try {
            const args = JSON.parse(call.arguments);
            const output = await executeTool(call.name, args, send, cardIds);
            toolResults.push({
              type: "function_call_output",
              call_id: call.call_id,
              output,
            });
          } catch (error) {
            toolResults.push({
              type: "function_call_output",
              call_id: call.call_id,
              output: JSON.stringify({
                error: error instanceof Error ? error.message : "Tool failed",
              }),
            });
          }
        }

        result = await openai.responses.create({
          model: "gpt-4o",
          instructions: systemPrompt,
          input: toolResults,
          tools,
        });
      }

      const textOutput = result.output.find((item) => item.type === "message");
      if (textOutput && textOutput.type === "message") {
        const textContent = textOutput.content.find((c) => c.type === "output_text");
        if (textContent && textContent.type === "output_text") {
          send("narration", { text: textContent.text });
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
