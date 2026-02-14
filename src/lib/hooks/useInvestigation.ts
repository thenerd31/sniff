"use client";

import { useState, useCallback, useRef } from "react";
import type { EvidenceCard } from "@/types";

interface Connection {
  from: string;
  to: string;
  label?: string;
}

interface InvestigationState {
  status: "idle" | "investigating" | "complete" | "error";
  cards: EvidenceCard[];
  connections: Connection[];
  threatScore: number;
  narration: string;
  investigationId: string | null;
  error: string | null;
}

const INITIAL_STATE: InvestigationState = {
  status: "idle",
  cards: [],
  connections: [],
  threatScore: 0,
  narration: "",
  investigationId: null,
  error: null,
};

/**
 * Hook that calls /api/investigate, /api/deepen, or /api/compare
 * and consumes SSE events in real-time.
 *
 * Usage:
 *   const { state, investigate, deepen, compare, reset } = useInvestigation();
 *   <button onClick={() => investigate("https://suspicious-site.com")}>
 */
export function useInvestigation() {
  const [state, setState] = useState<InvestigationState>(INITIAL_STATE);
  const abortRef = useRef<AbortController | null>(null);

  // ── Generic SSE consumer ────────────────────────────────────────────
  const consumeSSE = useCallback(
    async (url: string, body: Record<string, unknown>) => {
      // Abort any in-progress request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState((prev) => ({
        ...prev,
        status: "investigating",
        error: null,
        narration: "",
      }));

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error(`API returned ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split("\n\n");
          buffer = chunks.pop()!; // Keep incomplete chunk

          for (const chunk of chunks) {
            const dataMatch = chunk.match(/^data: (.+)$/m);
            if (!dataMatch) continue;

            try {
              const { event, data } = JSON.parse(dataMatch[1]);

              switch (event) {
                case "card":
                  setState((prev) => ({
                    ...prev,
                    cards: [...prev.cards, data as EvidenceCard],
                  }));
                  break;

                case "connection":
                  setState((prev) => ({
                    ...prev,
                    connections: [...prev.connections, data as Connection],
                  }));
                  break;

                case "threat_score":
                  setState((prev) => ({
                    ...prev,
                    threatScore: data.score,
                  }));
                  break;

                case "narration":
                  setState((prev) => ({
                    ...prev,
                    narration: data.text,
                  }));
                  break;

                case "done":
                  setState((prev) => ({
                    ...prev,
                    status: "complete",
                    investigationId: data.investigationId || prev.investigationId,
                  }));
                  break;

                case "error":
                  setState((prev) => ({
                    ...prev,
                    status: "error",
                    error: data.message,
                  }));
                  break;
              }
            } catch {
              // Bad JSON — skip
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setState((prev) => ({
          ...prev,
          status: "error",
          error: err instanceof Error ? err.message : "Unknown error",
        }));
      }
    },
    []
  );

  // ── Public API ──────────────────────────────────────────────────────
  const investigate = useCallback(
    (targetUrl: string) => {
      setState(INITIAL_STATE); // Fresh investigation
      return consumeSSE("/api/investigate", { url: targetUrl });
    },
    [consumeSSE]
  );

  const deepen = useCallback(
    (focus: string) => {
      if (!state.investigationId) return;
      return consumeSSE("/api/deepen", {
        investigationId: state.investigationId,
        focus,
        url: state.cards[0]?.metadata?.domain
          ? `https://${state.cards[0].metadata.domain}`
          : "",
        existingCards: state.cards,
      });
    },
    [consumeSSE, state.investigationId, state.cards]
  );

  const compare = useCallback(
    (productUrl: string) => {
      setState(INITIAL_STATE);
      return consumeSSE("/api/compare", { url: productUrl });
    },
    [consumeSSE]
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState(INITIAL_STATE);
  }, []);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    setState((prev) => ({ ...prev, status: "complete" }));
  }, []);

  return { state, investigate, deepen, compare, reset, abort };
}
