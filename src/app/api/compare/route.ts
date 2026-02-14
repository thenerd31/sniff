import { NextRequest } from "next/server";
import { runCompare } from "@/lib/agent";
import { createSSEStream, SSE_HEADERS } from "@/lib/stream";
import type { CompareRequest } from "@/types";

export async function POST(req: NextRequest) {
  let body: CompareRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body.productUrl) {
    return new Response(JSON.stringify({ error: "productUrl is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    new URL(body.productUrl);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid URL" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const stream = createSSEStream((writer) => runCompare(body.productUrl, writer));
  return new Response(stream, { headers: SSE_HEADERS });
}
