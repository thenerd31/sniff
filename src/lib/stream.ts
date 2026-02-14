import type { SSEEvent } from "@/types";
import type { SSEWriter } from "@/lib/agent";

/**
 * Creates an SSE ReadableStream + writer pair.
 * The `run` callback receives a writer function and should call it to emit events.
 * The stream is closed automatically when the callback resolves or rejects.
 */
export function createSSEStream(
  run: (writer: SSEWriter) => Promise<void>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      const writer: SSEWriter = (event: SSEEvent) => {
        const chunk = `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`;
        controller.enqueue(encoder.encode(chunk));
      };

      try {
        await run(writer);
      } catch (error) {
        const errorChunk = `event: error\ndata: ${JSON.stringify({
          message: error instanceof Error ? error.message : "Unknown error",
        })}\n\n`;
        controller.enqueue(encoder.encode(errorChunk));
      } finally {
        controller.close();
      }
    },
  });
}

/** Standard SSE response headers */
export const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
} as const;
