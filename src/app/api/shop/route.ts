// src/app/api/shop/route.ts
// POST /api/shop
// Accepts { text?, imageBase64?, imageMediaType? }
// Streams SSE: card | narration | done | error

import { NextRequest } from "next/server";
import { createSSEResponse } from "@/lib/stream";
import { runShoppingAgent } from "@/lib/shopping-agent";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { send, close, response } = createSSEResponse();

  (async () => {
    try {
      const body = await req.json();
      const text: string | undefined = body.text?.trim() || undefined;
      let imageBase64: string | undefined = body.imageBase64 || undefined;
      const imageMediaType: string | undefined =
        body.imageMediaType || undefined;

      // Strip data-URI prefix if the client sends a full data URL
      if (imageBase64?.startsWith("data:")) {
        imageBase64 = imageBase64.split(",")[1];
      }

      if (!text && !imageBase64) {
        send("error", {
          message: "Provide at least one of: text, imageBase64",
        });
        close();
        return;
      }

      await runShoppingAgent({ text, imageBase64, imageMediaType }, { send, close });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      send("error", { message: msg });
      close();
    }
  })();

  return response;
}
