// src/hooks/useResultsStream.ts
// SSE bridge that populates the results store.
// Can be called by Davyn's top-half to forward events,
// or can connect to the SSE endpoint directly.

"use client";

import { useCallback, useRef } from "react";
import { useResultsStore } from "@/stores/resultsStore";
import type { SearchSSEEvent } from "@/types";

/**
 * Hook that provides a `feedEvent` callback for forwarding SSE events
 * from the top-half into the results store, and a `connectSSE` function
 * for direct SSE connection if needed.
 */
export function useResultsStream() {
  const store = useResultsStore();
  const eventSourceRef = useRef<EventSource | null>(null);

  // Feed a single SSE event into the store
  const feedEvent = useCallback(
    (event: SearchSSEEvent) => {
      switch (event.event) {
        case "product":
          store.addProduct(event.data);
          break;
        case "fraud_check":
          store.addFraudCheck(event.data.productId, event.data.check);
          break;
        case "verdict":
          store.setVerdict(
            event.data.productId,
            event.data.verdict,
            event.data.trustScore
          );
          break;
        case "best_pick":
          store.setBestPick(event.data.productId);
          break;
        case "done":
          store.setDoneSummary(event.data.summary);
          store.setPhase("two-columns");
          break;
        case "all_products":
          // All products sent, verdicts may still be streaming
          break;
        default:
          break;
      }
    },
    [store]
  );

  // Direct SSE connection (optional fallback)
  const connectSSE = useCallback(
    (url: string) => {
      // Close existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const es = new EventSource(url);
      eventSourceRef.current = es;

      const eventTypes = [
        "product",
        "fraud_check",
        "verdict",
        "all_products",
        "best_pick",
        "done",
        "error",
      ] as const;

      eventTypes.forEach((type) => {
        es.addEventListener(type, (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            feedEvent({ event: type, data } as SearchSSEEvent);
          } catch {
            console.error(`Failed to parse SSE event: ${type}`, e.data);
          }
        });
      });

      es.onerror = () => {
        es.close();
        eventSourceRef.current = null;
      };

      return () => {
        es.close();
        eventSourceRef.current = null;
      };
    },
    [feedEvent]
  );

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  }, []);

  return { feedEvent, connectSSE, disconnect };
}
