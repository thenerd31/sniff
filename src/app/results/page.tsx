"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useResultsStore, useProductsWithVerdicts } from "@/stores/resultsStore";
import { ResultsContainer } from "@/components/results/ResultsContainer";
import type { SearchSSEEvent } from "@/types";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [narration, setNarration] = useState("Starting search...");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const store = useResultsStore();
  const startedRef = useRef(false);

  useEffect(() => {
    if (!query || startedRef.current) return;
    startedRef.current = true;
    store.reset();
    setIsStreaming(true);

    const abortController = new AbortController();

    (async () => {
      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
          signal: abortController.signal,
        });

        if (!res.ok || !res.body) {
          setError("Search failed. Please try again.");
          setIsStreaming(false);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const parsed = JSON.parse(line.slice(6)) as { event: string; data: unknown };
              const evt = parsed as SearchSSEEvent;

              switch (evt.event) {
                case "narration":
                  setNarration((evt.data as { text: string }).text);
                  break;
                case "product":
                  store.addProduct(evt.data as Parameters<typeof store.addProduct>[0]);
                  break;
                case "fraud_check": {
                  const fc = evt.data as { productId: string; check: Parameters<typeof store.addFraudCheck>[1] };
                  store.addFraudCheck(fc.productId, fc.check);
                  break;
                }
                case "verdict": {
                  const v = evt.data as { productId: string; verdict: Parameters<typeof store.setVerdict>[1]; trustScore: number };
                  store.setVerdict(v.productId, v.verdict, v.trustScore);
                  break;
                }
                case "best_pick": {
                  const bp = evt.data as { productId: string };
                  store.setBestPick(bp.productId);
                  break;
                }
                case "done": {
                  const d = evt.data as { summary: string };
                  store.setDoneSummary(d.summary);
                  store.setPhase("two-columns");
                  setIsStreaming(false);
                  break;
                }
                case "error": {
                  const e = evt.data as { message: string };
                  setError(e.message);
                  setIsStreaming(false);
                  break;
                }
              }
            } catch {
              // skip unparseable lines
            }
          }
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          setError("Connection lost. Please try again.");
          setIsStreaming(false);
        }
      }
    })();

    return () => {
      abortController.abort();
    };
  }, [query, store]);

  return (
    <div className="min-h-screen bg-[#FFFAF5]">
      {/* Top bar */}
      <div className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-3">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="h-4 w-px bg-gray-200" />
          <p className="text-sm font-medium text-foreground truncate">
            {query}
          </p>
          <div className="flex-1" />
          {isStreaming && (
            <div className="flex items-center gap-2 text-sm text-brand">
              <Loader2 className="h-4 w-4 animate-spin" />
              {narration}
            </div>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mx-auto max-w-2xl px-6 pt-20 text-center">
          <p className="text-red-500 font-medium">{error}</p>
          <Link href="/" className="mt-4 inline-block text-sm text-brand hover:underline">
            Try another search
          </Link>
        </div>
      )}

      {/* Streaming narration (while loading, before results appear) */}
      {isStreaming && Object.keys(store.verdicts).length === 0 && !error && (
        <div className="mx-auto max-w-2xl px-6 pt-32 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-brand" />
          <p className="mt-4 text-lg font-medium text-foreground">{narration}</p>
          <p className="mt-2 text-sm text-muted">Searching across retailers and running security checks...</p>
        </div>
      )}

      {/* Results — Manraj's animation pipeline */}
      <ResultsContainer />
    </div>
  );
}
