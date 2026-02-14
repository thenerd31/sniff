import { NextRequest } from "next/server";
import { createSSEResponse } from "@/lib/stream";
import OpenAI from "openai";
import { whoisLookup } from "@/lib/tools/whois";
import { safeBrowsingCheck } from "@/lib/tools/safe-browsing";
import { sslAnalysis } from "@/lib/tools/ssl";
import { redditSearch } from "@/lib/tools/reddit";
import { scrapeForRedFlags } from "@/lib/tools/scraper";
import { scamadviserCheck } from "@/lib/tools/scamadviser";
import type { EvidenceCard } from "@/types";

const openai = new OpenAI();

// ── System Prompt ──────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Sentinel, an AI investigation agent that analyzes URLs for potential scams and fraud.

You have investigation tools that return evidence. After each tool call, you receive structured findings. Your job is to:

1. Decide WHICH tools to call and in what order. Start broad (whois, ssl, safe_browsing), then go specific (reddit, scraper, scamadviser).
2. After receiving all tool results, call emit_evidence_card for EACH meaningful finding to pin it to the user's visual investigation board.
3. Connect related cards using connectTo IDs — show how evidence links together.
4. Call set_threat_score with your holistic assessment (0-100) and reasoning.

SEVERITY GUIDE:
- critical: Strong fraud indicator (domain < 30 days old, known scam reports, SSL mismatch)
- warning: Suspicious but not conclusive (no return policy, limited history, new domain < 1 year)
- info: Neutral finding worth noting
- safe: Positive indicator (established domain, valid SSL, good reviews)

RULES:
- Emit 6-10 evidence cards. Be thorough.
- Be specific: include exact dates, registrars, countries, ages in days.
- Write titles and details that a non-technical person can understand.
- If a tool fails or returns no data, still emit an info card noting the gap.
- Connect cards that reinforce or relate to each other.`;

// ── Tool Definition Helper ──────────────────────────────────────────────
function defineTool(name: string, description: string, parameters?: Record<string, unknown>): OpenAI.Responses.Tool {
  return {
    type: "function" as const,
    name,
    description,
    strict: false as const,
    parameters: parameters || {
      type: "object" as const,
      properties: { url: { type: "string" as const, description: "The full URL to investigate" } },
      required: ["url"] as const,
      additionalProperties: false as const,
    },
  };
}

// ── Tool Definitions for Responses API ─────────────────────────────────
const tools: OpenAI.Responses.Tool[] = [
  defineTool("whois_lookup", "Performs WHOIS lookup on the domain. Returns registration date, registrar, country, domain age. Young domains are a major scam indicator."),
  defineTool("ssl_analysis", "Analyzes SSL/TLS certificate. Checks issuer, validity, expiration, self-signed status. Missing or invalid SSL is a red flag."),
  defineTool("safe_browsing_check", "Checks URL against Google Safe Browsing database for known malware, phishing, and social engineering threats."),
  defineTool("scrape_red_flags", "Scrapes the webpage for scam red flags: fake urgency timers, missing return policies, suspicious payment methods, extreme discounts."),
  defineTool("reddit_search", "Searches Reddit for scam reports, complaints, and user experiences about this domain or seller."),
  defineTool("scamadviser_check", "Queries ScamAdviser for the domain's trust score and risk assessment."),
  defineTool("emit_evidence_card", "Pin an evidence card to the user's visual investigation board. Call this for EACH finding.", {
    type: "object" as const,
    properties: {
      type: { type: "string" as const, enum: ["domain", "ssl", "scam_report", "review_analysis", "price", "seller", "business", "alert", "email", "alternative"] },
      severity: { type: "string" as const, enum: ["critical", "warning", "info", "safe"] },
      title: { type: "string" as const, description: "Short headline (e.g. 'Domain registered 6 days ago')" },
      detail: { type: "string" as const, description: "Explanation with specifics (dates, numbers, sources)" },
      source: { type: "string" as const, description: "Where this came from (e.g. 'WHOIS Lookup')" },
      confidence: { type: "number" as const, description: "0.0 to 1.0" },
      connectTo: { type: "array" as const, items: { type: "string" as const }, description: "IDs of existing cards to connect to" },
    },
    required: ["type", "severity", "title", "detail", "source", "confidence"] as const,
    additionalProperties: false as const,
  }),
  defineTool("set_threat_score", "Set the overall threat score (0 = safe, 100 = confirmed fraud). Call this ONCE at the end.", {
    type: "object" as const,
    properties: {
      score: { type: "number" as const, description: "0 to 100" },
      reasoning: { type: "string" as const, description: "Brief explanation" },
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
    case "whois_lookup": {
      const card = await whoisLookup(args.url);
      return JSON.stringify(card);
    }
    case "ssl_analysis": {
      const card = await sslAnalysis(args.url);
      return JSON.stringify(card);
    }
    case "safe_browsing_check": {
      const card = await safeBrowsingCheck(args.url);
      return JSON.stringify(card);
    }
    case "scrape_red_flags": {
      const cards = await scrapeForRedFlags(args.url);
      return JSON.stringify(cards);
    }
    case "reddit_search": {
      const card = await redditSearch(args.url);
      return JSON.stringify(card);
    }
    case "scamadviser_check": {
      const card = await scamadviserCheck(args.url);
      return JSON.stringify(card);
    }
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
  const { url } = await req.json();
  const { send, close, response } = createSSEResponse();

  (async () => {
    try {
      const domain = new URL(url).hostname;
      const cardIds: string[] = [];
      const userMessage = `Investigate this URL for potential fraud or scams: ${url} (domain: ${domain})`;

      // Accumulate full conversation history for context
      const conversationHistory: OpenAI.Responses.ResponseInputItem[] = [
        { role: "user", content: userMessage },
      ];

      // First turn — agent decides what tools to call
      let result = await openai.responses.create({
        model: "gpt-4o",
        instructions: SYSTEM_PROMPT,
        input: conversationHistory,
        tools,
      });

      // Agent loop — keep processing until no more tool calls
      const MAX_ITERATIONS = 5;
      for (let i = 0; i < MAX_ITERATIONS; i++) {
        const toolCalls = result.output.filter(
          (item) => item.type === "function_call"
        );

        if (toolCalls.length === 0) break;

        // Append function_call items from output to history
        for (const item of result.output) {
          if (item.type === "function_call") {
            conversationHistory.push({
              type: "function_call",
              id: item.id,
              call_id: item.call_id,
              name: item.name,
              arguments: item.arguments,
            });
          }
        }

        // Execute tool calls and append results to history
        for (const call of toolCalls) {
          if (call.type !== "function_call") continue;

          send("narration", { text: `Running ${call.name.replace(/_/g, " ")}...` });

          try {
            const args = JSON.parse(call.arguments);
            const output = await executeTool(call.name, args, send, cardIds);
            conversationHistory.push({
              type: "function_call_output",
              call_id: call.call_id,
              output,
            });
          } catch (error) {
            conversationHistory.push({
              type: "function_call_output",
              call_id: call.call_id,
              output: JSON.stringify({
                error: error instanceof Error ? error.message : "Tool failed",
              }),
            });
          }
        }

        // Send full history back for next iteration
        result = await openai.responses.create({
          model: "gpt-4o",
          instructions: SYSTEM_PROMPT,
          input: conversationHistory,
          tools,
        });
      }

      // Extract final narration if any
      const textOutput = result.output.find((item) => item.type === "message");
      if (textOutput && textOutput.type === "message") {
        const textContent = textOutput.content.find((c) => c.type === "output_text");
        if (textContent && textContent.type === "output_text") {
          send("narration", { text: textContent.text });
        }
      }

      send("done", { summary: "Investigation complete" });
    } catch (error) {
      console.error("Investigation error:", error);
      send("error", { message: "Investigation failed" });
    } finally {
      close();
    }
  })();

  return response;
}
