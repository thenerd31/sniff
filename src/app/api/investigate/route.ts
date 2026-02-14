import { NextRequest } from "next/server";
import { createSSEResponse } from "@/lib/stream";
import OpenAI from "openai";
import { v4 as uuid } from "uuid";

// Tool implementations — Yifan builds these
import { whoisLookup } from "@/lib/tools/whois";
import { checkSafeBrowsing } from "@/lib/tools/safeBrowsing";
import { checkSSL } from "@/lib/tools/sslCheck";
import { searchReddit } from "@/lib/tools/redditSearch";

const openai = new OpenAI();

// ── System Prompt ──────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Sentinel, an AI investigation agent that analyzes URLs for potential scams and fraud.

You have tools to investigate a URL and tools to emit evidence cards to the user's visual investigation board.

PROCESS:
1. Use your investigation tools (whois_lookup, safe_browsing_check, ssl_check, reddit_search) to gather data about the URL.
2. For EACH finding, call emit_evidence_card to display it on the user's board.
3. After all investigation, call set_threat_score with your overall assessment (0-100).
4. Findings should be specific and factual. Include numbers, dates, and sources.

SEVERITY GUIDE:
- critical: Strong indicator of fraud (domain < 30 days old, known scam reports, SSL mismatch)
- warning: Suspicious but not conclusive (no return policy, limited history, new domain < 1 year)
- info: Neutral finding worth noting
- safe: Positive indicator (established domain, valid SSL, good reviews)

RULES:
- Always investigate: domain age, SSL status, safe browsing status, reddit/forum reports.
- Emit 6-10 evidence cards per investigation. Be thorough.
- Emit cards ONE AT A TIME as you discover findings. Do NOT batch them.
- Connect related cards using connectTo — link cards that share a finding or reinforce each other.
- Be specific: include exact dates, registrars, countries, ages in days.
- If a tool fails or returns no data, still emit an info card noting the gap.`;

// ── OpenAI Tool Definitions ────────────────────────────────────────────
const tools: OpenAI.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "whois_lookup",
      description:
        "Look up domain registration information including registration date, registrar, and registrant country",
      parameters: {
        type: "object",
        properties: { domain: { type: "string", description: "The domain to look up (e.g. example.com)" } },
        required: ["domain"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "safe_browsing_check",
      description:
        "Check a URL against Google Safe Browsing database for known malware, phishing, and social engineering threats",
      parameters: {
        type: "object",
        properties: { url: { type: "string", description: "The full URL to check" } },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ssl_check",
      description:
        "Analyze the SSL/TLS certificate of a domain for validity, issuer, expiry, and domain mismatch",
      parameters: {
        type: "object",
        properties: { domain: { type: "string", description: "The domain to check SSL for" } },
        required: ["domain"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "reddit_search",
      description:
        "Search Reddit for scam reports, complaints, or discussions about a domain or seller",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query — use domain name, seller name, or 'scam [domain]'",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "emit_evidence_card",
      description:
        "Add an evidence card to the user's visual investigation board. Call this for EACH finding.",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["domain", "ssl", "scam_report", "review_analysis", "price", "seller", "business", "alert", "email", "alternative"],
            description: "The category of evidence",
          },
          severity: {
            type: "string",
            enum: ["critical", "warning", "info", "safe"],
            description: "How concerning this finding is",
          },
          title: {
            type: "string",
            description: "Short headline for the card (e.g. 'Domain registered 6 days ago')",
          },
          detail: {
            type: "string",
            description: "Longer explanation with specifics (dates, numbers, sources)",
          },
          source: {
            type: "string",
            description: "Where this evidence came from (e.g. 'WHOIS Lookup', 'Google Safe Browsing')",
          },
          confidence: {
            type: "number",
            description: "How confident you are in this finding (0.0 to 1.0)",
          },
          connectTo: {
            type: "array",
            items: { type: "string" },
            description: "IDs of existing cards to draw connections to",
          },
        },
        required: ["type", "severity", "title", "detail", "source", "confidence"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_threat_score",
      description:
        "Set the overall threat score for this investigation (0 = completely safe, 100 = confirmed fraud)",
      parameters: {
        type: "object",
        properties: {
          score: { type: "number", description: "Threat score from 0 to 100" },
          reasoning: { type: "string", description: "Brief explanation of the score" },
        },
        required: ["score"],
      },
    },
  },
];

// ── Tool Executor ──────────────────────────────────────────────────────
async function executeTool(
  name: string,
  args: Record<string, unknown>,
  send: (event: string, data: unknown) => void,
  cardIds: string[]
): Promise<string> {
  switch (name) {
    case "whois_lookup":
      return JSON.stringify(await whoisLookup(args.domain as string));

    case "safe_browsing_check":
      return JSON.stringify(await checkSafeBrowsing(args.url as string));

    case "ssl_check":
      return JSON.stringify(await checkSSL(args.domain as string));

    case "reddit_search":
      return JSON.stringify(await searchReddit(args.query as string));

    case "emit_evidence_card": {
      const id = uuid();
      cardIds.push(id);
      send("card", {
        id,
        type: args.type,
        severity: args.severity,
        title: args.title,
        detail: args.detail,
        source: args.source,
        confidence: args.confidence,
        connections: args.connectTo || [],
        metadata: {},
      });
      if (Array.isArray(args.connectTo)) {
        for (const targetId of args.connectTo) {
          send("connection", { from: id, to: targetId });
        }
      }
      return JSON.stringify({ success: true, cardId: id });
    }

    case "set_threat_score": {
      send("threat_score", { score: args.score });
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

  // Run the agent loop in the background so we can return the stream immediately
  (async () => {
    try {
      const domain = new URL(url).hostname;
      const cardIds: string[] = [];

      const messages: OpenAI.ChatCompletionMessageParam[] = [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Investigate this URL for potential fraud or scams: ${url} (domain: ${domain})`,
        },
      ];

      // Agent loop — keep running until the model stops calling tools
      const MAX_ITERATIONS = 10;
      for (let i = 0; i < MAX_ITERATIONS; i++) {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages,
          tools,
          tool_choice: i === 0 ? "required" : "auto",
        });

        const assistantMessage = completion.choices[0].message;
        messages.push(assistantMessage);

        // If no tool calls, agent is done reasoning
        if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
          break;
        }

        // Execute all tool calls from this turn
        for (const toolCall of assistantMessage.tool_calls) {
          if (toolCall.type !== "function") continue;
          const args = JSON.parse(toolCall.function.arguments);
          const result = await executeTool(toolCall.function.name, args, send, cardIds);

          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: result,
          });
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
