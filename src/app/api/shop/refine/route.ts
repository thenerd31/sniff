// src/app/api/shop/refine/route.ts
// POST /api/shop/refine
//
// The "Guided Discovery" clarification loop.
// Accepts the current query + conversation history, returns one of:
//   { type: "question", question, options, internalReasoning }  — needs clarification
//   { type: "confirm",  refinedQuery, searchQueries, ... }      — agent thinks query is ready; user decides to finalize or keep refining
//   { type: "ready",    refinedQuery, searchQueries, ... }      — only returned when forceSearch=true (user explicitly finalized)
//
// Flow: caller loops until type="confirm", then user either:
//   a) sends forceSearch=true → type="ready" → fire /api/shop
//   b) adds more detail → continues the loop
//
// Body:
//   query        — the user's original / current query (required)
//   history      — [{ role, content }] conversation so far (optional)
//   forceSearch  — true to skip clarification and search immediately

import { NextRequest, NextResponse } from "next/server";
import { refineQuery } from "@/lib/query-refiner";
import type { ConversationMessage } from "@/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query: string = typeof body.query === "string" ? body.query.trim() : "";
    const history: ConversationMessage[] = Array.isArray(body.history) ? body.history : [];
    const forceSearch: boolean = body.forceSearch === true;

    if (!query) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    const result = await refineQuery(query, history, forceSearch);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[shop/refine] error:", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
