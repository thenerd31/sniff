import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";
import { toolDefinitions, executeTool } from "@/lib/tools";
import {
  createInvestigation,
  getInvestigation,
  addCards,
  updateThreatScore as storeUpdateThreatScore,
  incrementTurn,
} from "@/lib/investigationStore";
import { calcIncrementalScore, computeFinalThreatScore } from "@/lib/scoring";
import type { EvidenceCard, SSEEvent } from "@/types";

function getOpenAI() {
  return new OpenAI();
}

const INVESTIGATE_SYSTEM_PROMPT = `You are Sentinel, an AI investigation agent that exposes online scams and protects consumers. You have access to several investigation tools.

When given a URL to investigate:
1. Run whois_lookup, ssl_analysis, safe_browsing_check, scrape_red_flags, and brand_impersonation_check in your first round of tool calls
2. Also run reddit_search and scamadviser_check
3. After receiving all tool results, analyze the evidence holistically
4. Provide a narration summarizing your findings and an overall threat assessment

Be thorough but concise. Focus on actionable findings. When something is suspicious, explain WHY it's suspicious in plain language a non-technical person can understand.`;

const DEEPEN_PROMPTS: Record<string, string> = {
  seller: `Investigate the seller/business behind this domain more deeply. Look for business registration, shell company indicators, and cross-reference the seller identity across platforms.`,
  reviews: `Analyze reviews and user feedback about this site/seller. Look for fake review patterns, astroturfing, and authentic user complaints.`,
  business: `Trace the business entity behind this site. Look for business registration records, corporate filings, and connections to other known entities.`,
  alternatives: `Find legitimate alternatives for the products/services offered by this site. Look for well-known, trusted retailers offering similar items.`,
  price_history: `Analyze the pricing claims on this site. Compare prices with major retailers, check for fake discounts, and look at historical pricing data.`,
};

export type SSEWriter = (event: SSEEvent) => void;

/**
 * Turn 1: Initial investigation. Creates a new investigation in the store.
 * The investigation ID is sent via the "done" event so the frontend can use it for deepen calls.
 */
export async function runInvestigation(
  url: string,
  writer: SSEWriter
): Promise<void> {
  const investigationId = uuidv4();
  createInvestigation(investigationId, url);

  await runAgent(
    INVESTIGATE_SYSTEM_PROMPT,
    `Investigate this URL for potential scams: ${url}`,
    writer,
    investigationId,
    url
  );
}

/**
 * Turn 2+: Deepen an existing investigation with a specific focus.
 * Carries forward all prior evidence as context so the agent doesn't repeat findings.
 */
export async function runDeepen(
  investigationId: string,
  focus: string,
  writer: SSEWriter
): Promise<void> {
  const investigation = getInvestigation(investigationId);
  if (!investigation) {
    writer({
      event: "error",
      data: { message: `Investigation ${investigationId} not found. It may have expired.` },
    });
    return;
  }

  incrementTurn(investigationId);

  const focusPrompt = DEEPEN_PROMPTS[focus] || DEEPEN_PROMPTS.seller;

  // Build context from previous findings
  const priorContext = investigation.cards
    .map((c) => `[${c.severity.toUpperCase()}] ${c.title}: ${c.detail} (source: ${c.source})`)
    .join("\n");

  const contextualPrompt = `${focusPrompt}

URL: ${investigation.url}

This is Turn ${investigation.turn} of the investigation. Current threat score: ${investigation.threatScore}/100.

Previous findings:
${priorContext}

Build on these findings — don't repeat what's already known. Focus on NEW evidence.`;

  await runAgent(
    INVESTIGATE_SYSTEM_PROMPT,
    contextualPrompt,
    writer,
    investigationId,
    investigation.url
  );
}

export async function runCompare(
  productUrl: string,
  writer: SSEWriter
): Promise<void> {
  await runAgent(
    INVESTIGATE_SYSTEM_PROMPT,
    `Find and compare prices for the product at this URL across legitimate retailers: ${productUrl}`,
    writer,
    undefined,
    productUrl
  );
}

async function runAgent(
  systemPrompt: string,
  userMessage: string,
  writer: SSEWriter,
  investigationId?: string,
  url?: string
): Promise<void> {
  let threatScore = investigationId
    ? (getInvestigation(investigationId)?.threatScore ?? 0)
    : 0;
  let cardCount = 0;
  // Collect all cards so the veto scorer can see the full picture at the end
  const roundCards: EvidenceCard[] = [];

  try {
    const response = await getOpenAI().responses.create({
      model: "gpt-4o",
      instructions: systemPrompt,
      input: userMessage,
      tools: toolDefinitions,
    });

    const toolCalls = response.output.filter(
      (item) => item.type === "function_call"
    );

    if (toolCalls.length > 0) {
      // Execute all tool calls in parallel for speed
      const toolResults = await Promise.all(
        toolCalls
          .filter((call) => call.type === "function_call")
          .map(async (call) => {
            if (call.type !== "function_call") {
              return { call_id: "", output: "" };
            }

            writer({
              event: "narration",
              data: { text: `Running ${call.name.replace(/_/g, " ")}...` },
            });

            try {
              const args = JSON.parse(call.arguments);
              const result = await executeTool(call.name, args);
              const cards = Array.isArray(result) ? result : [result];

              for (const card of cards) {
                writer({ event: "card", data: card });
                cardCount++;
                roundCards.push(card);
                // Incremental score for real-time UX — will be overridden by veto pass below
                threatScore = calcIncrementalScore(threatScore, card);
                writer({ event: "threat_score", data: { score: threatScore } });
              }

              // Persist cards for multi-turn context
              if (investigationId) {
                addCards(investigationId, cards);
                storeUpdateThreatScore(investigationId, threatScore);
              }

              return {
                call_id: call.call_id,
                output: JSON.stringify(cards),
              };
            } catch (error) {
              return {
                call_id: call.call_id,
                output: JSON.stringify({
                  error: error instanceof Error ? error.message : "Tool execution failed",
                }),
              };
            }
          })
      );

      // ── Critical Veto pass ────────────────────────────────────────────
      // Once all tools have run, re-compute the authoritative threat score
      // using the tiered hierarchy. This overrides the incremental estimate.
      if (url && roundCards.length > 0) {
        const vetoScore = computeFinalThreatScore(roundCards, url);
        if (vetoScore !== threatScore) {
          threatScore = vetoScore;
          writer({ event: "threat_score", data: { score: threatScore } });
          if (investigationId) {
            storeUpdateThreatScore(investigationId, threatScore);
          }
        }
      }

      // Send tool results back for final analysis
      const followUp = await getOpenAI().responses.create({
        model: "gpt-4o",
        instructions: systemPrompt,
        input: [
          { role: "user", content: userMessage },
          ...response.output.map((item) => {
            if (item.type === "function_call") {
              return {
                type: "function_call" as const,
                id: item.id,
                call_id: item.call_id,
                name: item.name,
                arguments: item.arguments,
              };
            }
            return item;
          }),
          ...toolResults.map((r) => ({
            type: "function_call_output" as const,
            call_id: r.call_id,
            output: r.output,
          })),
        ],
        tools: toolDefinitions,
      });

      const textOutput = followUp.output.find((item) => item.type === "message");
      if (textOutput && textOutput.type === "message") {
        const textContent = textOutput.content.find((c) => c.type === "output_text");
        if (textContent && textContent.type === "output_text") {
          writer({
            event: "narration",
            data: { text: textContent.text },
          });
        }
      }
    }

    writer({
      event: "done",
      data: {
        summary: `Investigation complete. Found ${cardCount} evidence items. Threat score: ${threatScore}/100.${investigationId ? ` Investigation ID: ${investigationId}` : ""}`,
      },
    });
  } catch (error) {
    writer({
      event: "error",
      data: {
        message: error instanceof Error ? error.message : "Investigation failed",
      },
    });
  }
}

