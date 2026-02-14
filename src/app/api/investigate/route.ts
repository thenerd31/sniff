import { NextRequest } from "next/server";
import { runInvestigation, type SSEWriter } from "@/lib/agent";
import type { InvestigateRequest, SSEEvent } from "@/types";

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

  // Validate URL
  try {
    new URL(body.url);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid URL" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const writer: SSEWriter = (event: SSEEvent) => {
        const data = `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`;
        controller.enqueue(encoder.encode(data));
      };

      try {
        await runInvestigation(body.url, writer);
      } catch (error) {
        const errorData = `event: error\ndata: ${JSON.stringify({ message: error instanceof Error ? error.message : "Unknown error" })}\n\n`;
        controller.enqueue(encoder.encode(errorData));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
