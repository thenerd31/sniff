import { NextRequest } from "next/server";
import { createSSEResponse } from "@/lib/stream";
import OpenAI from "openai";
import { v4 as uuid } from "uuid";
import { EvidenceCard } from "@/types";

// Tool implementations — Yifan builds these
import { whoisLookup } from "@/lib/tools/whois";
import { checkSafeBrowsing } from "@/lib/tools/safeBrowsing";
import { checkSSL } from "@/lib/tools/sslCheck";
import { searchReddit } from "@/lib/tools/redditSearch";

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

// ── System Prompt ──────────────────────────────────────────────────────
function buildDeepenPrompt(
  focus: string,
  existingCards: EvidenceCard[]
): string {
  const existingSummary = existingCards
    .map((c) => `- [${c.severity.toUpperCase()}] ${c.title}: ${c.detail}`)
    .join("\n");

  const existingIds = existingCards.map((c) => c.id).join(", ");

  const focusInstructions =
    FOCUS_PROMPTS[focus] || `Investigate further in the area of: ${focus}`;

  return `You are Sentinel, continuing an existing fraud investigation. The user wants to dig deeper.

EXISTING EVIDENCE (already on the board):
${existingSummary}

EXISTING CARD IDS (for connecting new cards): ${existingIds}

${focusInstructions}

RULES:
- Emit ONLY NEW findings. Do NOT repeat existing evidence.
- Connect new cards to existing ones where relevant using connectTo.
- Update the threat score based on all evidence (old + new).
- Be specific with dates, numbers, sources.`;
}

// ── Same tools as investigate route ────────────────────────────────────
const tools: OpenAI.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "whois_lookup",
      description: "Look up domain registration information",
      parameters: {
        type: "object",
        properties: { domain: { type: "string" } },
        required: ["domain"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "safe_browsing_check",
      description: "Check URL against Google Safe Browsing database",
      parameters: {
        type: "object",
        properties: { url: { type: "string" } },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ssl_check",
      description: "Analyze SSL/TLS certificate of a domain",
      parameters: {
        type: "object",
        properties: { domain: { type: "string" } },
        required: ["domain"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "reddit_search",
      description: "Search Reddit for scam reports or discussions",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "emit_evidence_card",
      description: "Add an evidence card to the investigation board",
      parameters: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["domain", "ssl", "scam_report", "review_analysis", "price", "seller", "business", "alert", "email", "alternative"],
          },
          severity: { type: "string", enum: ["critical", "warning", "info", "safe"] },
          title: { type: "string" },
          detail: { type: "string" },
          source: { type: "string" },
          confidence: { type: "number" },
          connectTo: { type: "array", items: { type: "string" } },
        },
        required: ["type", "severity", "title", "detail", "source", "confidence"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_threat_score",
      description: "Update the overall threat score (0-100)",
      parameters: {
        type: "object",
        properties: {
          score: { type: "number" },
          reasoning: { type: "string" },
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
  const { focus, existingCards, url } = await req.json();
  const { send, close, response } = createSSEResponse();

  (async () => {
    try {
      const domain = new URL(url).hostname;
      const cardIds: string[] = (existingCards || []).map(
        (c: EvidenceCard) => c.id
      );

      const messages: OpenAI.ChatCompletionMessageParam[] = [
        {
          role: "system",
          content: buildDeepenPrompt(focus, existingCards || []),
        },
        {
          role: "user",
          content: `Dig deeper into "${focus}" for URL: ${url} (domain: ${domain})`,
        },
      ];

      const MAX_ITERATIONS = 8;
      for (let i = 0; i < MAX_ITERATIONS; i++) {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages,
          tools,
          tool_choice: i === 0 ? "required" : "auto",
        });

        const assistantMessage = completion.choices[0].message;
        messages.push(assistantMessage);

        if (
          !assistantMessage.tool_calls ||
          assistantMessage.tool_calls.length === 0
        ) {
          break;
        }

        for (const toolCall of assistantMessage.tool_calls) {
          if (toolCall.type !== "function") continue;
          const args = JSON.parse(toolCall.function.arguments);
          const result = await executeTool(
            toolCall.function.name,
            args,
            send,
            cardIds
          );

          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: result,
          });
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
