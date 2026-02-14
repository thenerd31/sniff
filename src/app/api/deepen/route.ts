import { NextRequest } from "next/server";
import { runDeepen, type SSEWriter } from "@/lib/agent";
import type { DeepenRequest, SSEEvent } from "@/types";

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

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const writer: SSEWriter = (event: SSEEvent) => {
        const data = `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`;
        controller.enqueue(encoder.encode(data));
      };

      try {
        // TODO: Look up the original URL from investigationId in a persistent store
        // For now, the frontend should pass the URL as part of the investigation context
        await runDeepen(body.investigationId, body.focus, writer);
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
