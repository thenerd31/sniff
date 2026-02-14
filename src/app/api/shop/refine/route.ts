// src/app/api/shop/refine/route.ts
// POST /api/shop/refine
//
// The "Guided Discovery" clarification loop.
// Accepts the current query + conversation history, returns either:
//   { type: "question", question, options, internalReasoning }
//   { type: "ready",    refinedQuery, searchQueries, internalReasoning }
//
// The caller keeps sending updated history until type="ready",
// then fires /api/shop with the refinedQuery / searchQueries.
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
