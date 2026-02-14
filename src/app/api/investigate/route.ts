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
const SYSTEM_PROMPT = `You are Sentinel, an AI investigation agent that analyzes URLs for potential scams and fraud. You present findings on a visual investigation board.

STEP 1 — GATHER EVIDENCE:
Call ALL of these tools in your first turn (call them all at once in parallel):
- whois_lookup
- ssl_analysis
- safe_browsing_check
- scrape_red_flags
- reddit_search
- scamadviser_check

STEP 2 — EMIT EVIDENCE CARDS:
After receiving tool results, you MUST call emit_evidence_card for EVERY finding. Create one card per tool result at minimum. You MUST emit at least 6 cards. For each card:
- Write a clear, specific title (e.g. "Domain registered 6 days ago" not "Domain information")
- Include exact numbers, dates, registrars, countries in the detail
- Set severity based on the guide below
- Use connectTo to link related cards by their IDs

STEP 3 — SET THREAT SCORE:
After emitting ALL cards, you MUST call set_threat_score exactly once with:
- score: 0-100 based on the totality of evidence
- reasoning: 1-2 sentence explanation

SEVERITY GUIDE:
- critical: Strong fraud indicator (domain < 30 days old, known scam reports, SSL mismatch, flagged by Safe Browsing)
- warning: Suspicious but not conclusive (no return policy, limited history, domain < 1 year, failed tool checks)
- info: Neutral finding worth noting (no Reddit mentions, inconclusive data)
- safe: Positive indicator (established domain, valid SSL, good reviews, not flagged)

THREAT SCORE GUIDE:
- 0-25: Low risk. Established, legitimate site.
- 26-50: Moderate. Some concerns but not conclusive.
- 51-75: High risk. Multiple red flags.
- 76-100: Critical. Strong evidence of fraud.

IMPORTANT: You MUST emit at least 6 evidence cards and MUST call set_threat_score. Do NOT skip these steps.`;

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
      send("narration", { text: `Threat assessment: ${args.reasoning || ""}` });
      return JSON.stringify({ success: true, tool: "set_threat_score" });
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
      let threatScoreSet = false;
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
          if (call.name === "set_threat_score") threatScoreSet = true;

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

      // If the agent didn't set a threat score, force one more call
      if (!threatScoreSet) {
        // Check if any emit_evidence_card was called to determine if we have cards
        const hasCards = cardIds.length > 0;
        if (hasCards) {
          const forceScore = await openai.responses.create({
            model: "gpt-4o",
            instructions: "You are Sentinel. Based on the investigation so far, you MUST call set_threat_score with a score (0-100) and reasoning. Do it now.",
            input: conversationHistory,
            tools: tools.filter((t) => t.type === "function" && t.name === "set_threat_score"),
          });
          for (const item of forceScore.output) {
            if (item.type === "function_call") {
              const args = JSON.parse(item.arguments);
              send("threat_score", { score: parseFloat(args.score) || 0 });
              send("narration", { text: `Threat assessment: ${args.reasoning || ""}` });
            }
          }
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
