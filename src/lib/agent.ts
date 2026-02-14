import OpenAI from "openai";
import { toolDefinitions, executeTool } from "@/lib/tools";
import type { EvidenceCard, SSEEvent } from "@/types";

function getOpenAI() {
  return new OpenAI();
}

const INVESTIGATE_SYSTEM_PROMPT = `You are Sentinel, an AI investigation agent that exposes online scams and protects consumers. You have access to several investigation tools.

When given a URL to investigate:
1. Run whois_lookup, ssl_analysis, safe_browsing_check, and scrape_red_flags in your first round of tool calls
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

export async function runInvestigation(
  url: string,
  writer: SSEWriter
): Promise<void> {
  await runAgent(
    INVESTIGATE_SYSTEM_PROMPT,
    `Investigate this URL for potential scams: ${url}`,
    writer
  );
}

export async function runDeepen(
  url: string,
  focus: string,
  writer: SSEWriter
): Promise<void> {
  const focusPrompt = DEEPEN_PROMPTS[focus] || DEEPEN_PROMPTS.seller;
  await runAgent(
    INVESTIGATE_SYSTEM_PROMPT,
    `${focusPrompt}\n\nURL: ${url}`,
    writer
  );
}

export async function runCompare(
  productUrl: string,
  writer: SSEWriter
): Promise<void> {
  await runAgent(
    INVESTIGATE_SYSTEM_PROMPT,
    `Find and compare prices for the product at this URL across legitimate retailers: ${productUrl}`,
    writer
  );
}

async function runAgent(
  systemPrompt: string,
  userMessage: string,
  writer: SSEWriter
): Promise<void> {
  let threatScore = 0;
  let cardCount = 0;

  try {
    const response = await getOpenAI().responses.create({
      model: "gpt-4o",
      instructions: systemPrompt,
      input: userMessage,
      tools: toolDefinitions,
    });

    // Process tool calls
    const toolCalls = response.output.filter(
      (item) => item.type === "function_call"
    );

    if (toolCalls.length > 0) {
      // Execute all tool calls and collect results
      const toolResults: { call_id: string; output: string }[] = [];
      for (const call of toolCalls) {
        if (call.type !== "function_call") continue;

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
            threatScore = updateThreatScore(threatScore, card);
            writer({
              event: "threat_score",
              data: { score: threatScore },
            });
          }

          toolResults.push({
            call_id: call.call_id,
            output: JSON.stringify(cards),
          });
        } catch (error) {
          toolResults.push({
            call_id: call.call_id,
            output: JSON.stringify({
              error: error instanceof Error ? error.message : "Tool execution failed",
            }),
          });
        }
      }

      // Send tool results back for final analysis
      const followUp = await getOpenAI().responses.create({
        model: "gpt-4o",
        instructions: systemPrompt,
        input: [
          { role: "user", content: userMessage },
          // Include original response output items
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
          // Include tool results
          ...toolResults.map((r) => ({
            type: "function_call_output" as const,
            call_id: r.call_id,
            output: r.output,
          })),
        ],
        tools: toolDefinitions,
      });

      // Extract final text response
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

    // Auto-generate connections between related cards
    // (connections are generated based on card types that naturally relate)

    writer({
      event: "done",
      data: {
        summary: `Investigation complete. Found ${cardCount} evidence items. Threat score: ${threatScore}/100.`,
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

function updateThreatScore(current: number, card: EvidenceCard): number {
  const severityWeights: Record<string, number> = {
    critical: 20,
    warning: 10,
    info: 2,
    safe: -5,
  };
  const delta = severityWeights[card.severity] ?? 0;
  return Math.max(0, Math.min(100, current + delta));
}
