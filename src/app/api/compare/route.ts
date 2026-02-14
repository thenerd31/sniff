import { NextRequest } from "next/server";
import { runCompare, type SSEWriter } from "@/lib/agent";
import type { CompareRequest, SSEEvent } from "@/types";

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

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const writer: SSEWriter = (event: SSEEvent) => {
        const data = `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`;
        controller.enqueue(encoder.encode(data));
      };

      try {
        await runCompare(body.productUrl, writer);
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
