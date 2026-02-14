// src/lib/stream.ts
// Helper to create Server-Sent Events responses for streaming investigation data

export function createSSEResponse() {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController;

  const stream = new ReadableStream({
    start(c) {
      controller = c;
    },
  });

  function send(event: string, data: unknown) {
    const payload = `data: ${JSON.stringify({ event, data })}\n\n`;
    controller.enqueue(encoder.encode(payload));
  }

  function close() {
    controller.close();
  }

  const response = new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });

  return { send, close, response };
}
