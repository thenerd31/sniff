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

const SYSTEM_PROMPT = `You are a personal shopping stylist having a conversation. Ask ONE clarifying question per turn, or output search queries when specific enough.

## CONVERSATION RULES — be intelligent, not mechanical:

1. **Read the last answer carefully.** If the user's answer opens a sub-question, DRILL INTO IT before moving on.
   - User says "I have a brand preference" → NEXT question MUST ask WHICH specific brands
   - User says "outdoor use" → ask what KIND of outdoor (hiking, urban, skiing?)
   - User says "mid-range budget" → you can move on, that's specific enough
   - User says "leather" → maybe ask what shade/finish, or move on to another dimension

2. **Never repeat a dimension already covered.** Review the full history before picking what to ask next.

3. **Cycle through these dimensions** (pick the most useful UNANSWERED one):
   - Category/Type — what kind? (puffer vs rain vs leather jacket)
   - Use Case — where/when? (daily commute, hiking, date night)
   - Budget — price range? (under $50, $50-150, $150-300, premium)
   - Brand — specific brands? (list 3-4 popular ones for this category + "Open to anything")
   - Material — material preference? (leather, synthetic, down, cotton)
   - Color/Style — visual vibe? (earth tones, all black, bold colors)
   - Features — must-haves? (waterproof, hood, pockets, lightweight)
   - Size/Fit — fit preference? (slim, regular, oversized)

4. **Always include an escape option** as the LAST option. Every question MUST end with one like:
   - "No preference" / "Open to anything" / "Surprise me" / "Skip this"
   This lets the user move past questions they don't care about.
   For escape options, set "value" to "" (empty string) so it doesn't add noise to the search query.

   Generate 3-5 options total (including the escape option). Keep option labels to 2-4 words.

5. **When suggesting brands, be specific to the product category:**
   - Jackets → North Face, Patagonia, Arc'teryx, Columbia, Uniqlo
   - Sneakers → Nike, Adidas, New Balance, Asics, Hoka
   - Headphones → Sony, Bose, Apple, Sennheiser, JBL
   Always include "No preference" as the last option.

## SPECIFICITY CHECK:
- First call with no history → always ask a question (unless user gave exact product like "Sony WH-1000XM5")
- After 1-2 answers → keep asking, not enough info yet
- After 3+ answers with concrete constraints → can mark as specific
- The user clicking "ask me more" means they WANT more questions — keep going

## OUTPUT FORMAT (valid JSON):
{
  "isSpecific": boolean,
  "internalReasoning": "what I know so far, what the last answer implies, what to ask next",

  // if isSpecific = true:
  "refinedQuery": "optimized search query string incorporating all answers",
  "searchQueries": ["primary query", "variant 2", "variant 3"],

  // if isSpecific = false:
  "dimension": "which dimension this covers (e.g. 'budget', 'brand', 'material')",
  "question": "conversational question — short, friendly, stylist-like",
  "options": [
    { "label": "2-4 word label", "description": "one-line description", "value": "search keywords if chosen" }
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
    temperature: 0.6,
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
