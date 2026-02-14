import { NextRequest } from "next/server";
import { runInvestigation } from "@/lib/agent";
import { createSSEStream, SSE_HEADERS } from "@/lib/stream";
import type { InvestigateRequest } from "@/types";

export async function POST(req: NextRequest) {
  let body: InvestigateRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body.url) {
    return new Response(JSON.stringify({ error: "url is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    new URL(body.url);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid URL" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const stream = createSSEStream((writer) => runInvestigation(body.url, writer));
  return new Response(stream, { headers: SSE_HEADERS });
}
