"use client";

import { useCallback, useRef } from "react";
import { useAgentStore } from "@/stores/agentStore";
import { transformCardToResult } from "@/lib/classifyResult";
import type { EvidenceCard } from "@/types";

export function useShoppingAgent() {
  const store = useAgentStore;
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(async (text: string, imageFile?: File) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const state = store.getState();
    if (state.phase !== "searching") {
      state.reset();
      state.setPhase("searching");
      state.setQuery({ text, imageFile });
    }

    try {
      const body: Record<string, string> = { query: text };
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) throw new Error(`API ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop()!;

        for (const chunk of chunks) {
          const dataMatch = chunk.match(/^data: (.+)$/m);
          if (!dataMatch) continue;
          try {
            const { event, data } = JSON.parse(dataMatch[1]);
            const s = store.getState();
            switch (event) {
              case "card": {
                const result = transformCardToResult(data as EvidenceCard);
                s.addResult(result);
                break;
              }
              case "narration":
                s.setNarration(data.text);
                break;
              case "done":
                s.setPhase("reviewing");
                break;
              case "error":
                s.setError(data.message);
                break;
            }
          } catch {
            /* skip bad JSON */
          }
        }
      }

      // If stream ended without "done" event
      const finalState = store.getState();
      if (finalState.phase === "searching") {
        finalState.setPhase("reviewing");
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      store.getState().setError((err as Error).message);
    }
  }, []);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    store.getState().setPhase("reviewing");
  }, []);

  return { search, abort };
}
