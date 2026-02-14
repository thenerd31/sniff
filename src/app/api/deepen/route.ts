import { NextRequest } from "next/server";
import { runDeepen } from "@/lib/agent";
import { createSSEStream, SSE_HEADERS } from "@/lib/stream";
import type { DeepenRequest } from "@/types";

export async function POST(req: NextRequest) {
  let body: DeepenRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body.investigationId || !body.focus) {
    return new Response(
      JSON.stringify({ error: "investigationId and focus are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const validFocuses = ["seller", "reviews", "business", "alternatives", "price_history"];
  if (!validFocuses.includes(body.focus)) {
    return new Response(
      JSON.stringify({ error: `focus must be one of: ${validFocuses.join(", ")}` }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const stream = createSSEStream((writer) =>
    runDeepen(body.investigationId, body.focus, writer)
  );
  return new Response(stream, { headers: SSE_HEADERS });
}
