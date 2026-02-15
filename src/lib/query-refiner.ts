// src/lib/query-refiner.ts
// "Guided Discovery" engine — determines if a shopping query is specific enough
// to search, or asks the single highest-information-gain clarifying question.
//
// The agent acts like a personal stylist:
//   vague query  → 2–4 lifestyle "paths" to choose from
//   specific query → optimized search query + 2–3 search variants

import OpenAI from "openai";
import type { ConversationMessage, RefineResult } from "@/types";

let _openai: OpenAI | null = null;
const getOpenAI = () => (_openai ??= new OpenAI());

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a personal shopping stylist and search assistant. Your job is to ask the SINGLE most useful clarifying question — or, when the query is already specific enough, output optimized search queries.

## A query is SPECIFIC ENOUGH when:
- The product category is clear
- At least one key differentiator is known (use case, aesthetic/vibe, or a concrete constraint like material, warmth, price range)
- A search would return targeted results, not a scattered mix

Examples that are SPECIFIC ENOUGH:
- "waterproof urban jacket" — use case + context clear
- "insulated Arc'teryx jacket city wear" — brand + spec + use case
- "Sony WH-1000XM5 noise-cancelling headphones" — specific product

Examples NOT SPECIFIC ENOUGH:
- "a jacket" — infinite categories
- "nice sneakers" — streetwear? athletic? dress?
- "headphones" — commuting? studio? gaming?
- "laptop" — work? gaming? portability focus?

## How to choose the clarifying question:
1. Identify the SINGLE variable with the highest information gain — the one that most fundamentally splits the search space (e.g. "Occasion" >> "Color"; "Use case" >> "Brand preference")
2. Generate 2–4 distinct "vibes" or "paths" — lifestyle/use-case archetypes, NOT feature lists
3. Sound like a stylist, not a form. Keep options short and vivid.

## Output JSON (always return valid JSON):
{
  "isSpecific": boolean,
  "internalReasoning": "brief internal monologue: what you know, what's still ambiguous, what variable you chose to ask about",

  // if isSpecific = true — include these:
  "refinedQuery": "the optimized, specific search query string",
  "searchQueries": ["primary query", "variant 2", "variant 3"],

  // if isSpecific = false — include these:
  "question": "the conversational question to ask the user",
  "options": [
    { "label": "Short vivid label", "description": "One-line description of this path", "value": "keywords that narrow the query if this option is chosen" }
  ]
}`;

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Analyzes the query + conversation history and either:
 *   - Returns a clarifying question (type: "question") if the query is too vague
 *   - Returns refined search queries (type: "ready") if specific enough
 *
 * Set forceSearch=true when the user explicitly wants to search now.
 */
export async function refineQuery(
  initialQuery: string,
  history: ConversationMessage[],
  forceSearch = false
): Promise<RefineResult> {
  const forceNote = forceSearch
    ? "\n\nThe user wants to search now — treat the query as specific enough."
    : "";

  // Build conversation context for the LLM
  const contextLines: string[] = [`Initial request: "${initialQuery}"`];
  if (history.length > 0) {
    contextLines.push(
      "\nConversation so far:",
      ...history.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    );
  }

  const { choices } = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: contextLines.join("\n") + forceNote },
    ],
  });

  const raw = JSON.parse(choices[0]?.message?.content ?? "{}");
  const reasoning: string = typeof raw.internalReasoning === "string" ? raw.internalReasoning : "";

  // ── Specific enough → ready to search ────────────────────────────────────
  if (raw.isSpecific || forceSearch) {
    // Build a fallback refined query from the full history if LLM didn't provide one
    const refinedQuery: string =
      typeof raw.refinedQuery === "string" && raw.refinedQuery.trim()
        ? raw.refinedQuery.trim()
        : [initialQuery, ...history.filter((m) => m.role === "user").map((m) => m.content)]
            .join(" ")
            .trim();

    const searchQueries: string[] =
      Array.isArray(raw.searchQueries) && raw.searchQueries.length > 0
        ? raw.searchQueries.filter((q: unknown) => typeof q === "string")
        : [refinedQuery];

    return { type: "ready", refinedQuery, searchQueries, internalReasoning: reasoning };
  }

  // ── Needs clarification → return question ─────────────────────────────────
  return {
    type: "question",
    question:
      typeof raw.question === "string"
        ? raw.question
        : "Can you tell me more about what you're looking for?",
    options: Array.isArray(raw.options) ? raw.options : [],
    internalReasoning: reasoning,
  };
}
