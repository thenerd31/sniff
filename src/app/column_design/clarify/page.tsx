"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ClarifyingQuestions } from "@/components/clarify/ClarifyingQuestions";
import type { Refinement, ClarifyAnswer } from "@/types/clarify";
import type { ConversationMessage } from "@/types";
import "./clarify.css";

const PIXEL_FONT = "'Press Start 2P', monospace";

// Convert /api/shop/refine "question" response to a Refinement
function refineResponseToRefinement(data: {
  question: string;
  dimension?: string;
  options: Array<{ label: string; description?: string; value: string }>;
}): Refinement {
  // Use the dimension field from the refiner if available, otherwise extract from question
  let label = "Preference";
  if (data.dimension) {
    // Capitalize first letter
    label = data.dimension.charAt(0).toUpperCase() + data.dimension.slice(1);
  } else {
    const q = data.question.toLowerCase();
    if (q.includes("style") || q.includes("aesthetic") || q.includes("look")) label = "Style";
    else if (q.includes("budget") || q.includes("price") || q.includes("spend")) label = "Budget";
    else if (q.includes("size") || q.includes("fit")) label = "Size";
    else if (q.includes("color") || q.includes("colour")) label = "Color";
    else if (q.includes("brand")) label = "Brand";
    else if (q.includes("use") || q.includes("occasion") || q.includes("purpose") || q.includes("wear") || q.includes("where")) label = "Use Case";
    else if (q.includes("material") || q.includes("fabric")) label = "Material";
    else if (q.includes("feature") || q.includes("priority")) label = "Features";
    else if (q.includes("type") || q.includes("kind") || q.includes("category")) label = "Type";
  }

  return {
    label,
    questionText: data.question,
    options: data.options.map((o) => o.label),
    type: "buttons",
  };
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function ClarifyTestPage() {
  return (
    <Suspense>
      <ClarifyTestPageInner />
    </Suspense>
  );
}

function ClarifyTestPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryParam = searchParams.get("q") || "jacket";

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [refinedQuery, setRefinedQuery] = useState("");
  const [collectedAnswers, setCollectedAnswers] = useState<ClarifyAnswer[]>([]);
  const [productName, setProductName] = useState(queryParam);
  const [refinements, setRefinements] = useState<Refinement[]>([]);
  const historyRef = useRef<ConversationMessage[]>([]);
  // Store the raw refine option values so we can build proper history
  const optionValuesRef = useRef<Map<string, string>>(new Map());

  // Call /api/shop/refine on mount (first turn)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/shop/refine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: queryParam }),
        });
        const data = await res.json();

        if (data.type === "ready" || data.error) {
          // Query is specific enough — skip straight to board
          const q = data.refinedQuery || queryParam;
          window.location.href = `/board_test?query=${encodeURIComponent(q)}`;
          return;
        }

        // Store the question in history
        if (data.question) {
          historyRef.current.push({
            role: "assistant",
            content: data.question,
          });
        }

        // Map option labels → values for history tracking
        if (Array.isArray(data.options)) {
          for (const opt of data.options) {
            optionValuesRef.current.set(opt.label, opt.value || opt.label);
          }
        }

        setProductName(queryParam);
        setRefinements([refineResponseToRefinement(data)]);
        setLoading(false);
      } catch {
        window.location.href = `/board_test?query=${encodeURIComponent(queryParam)}`;
      }
    })();
  }, [queryParam, router]);

  // Called when user clicks "Ask me more" and all current refinements are used up
  const handleAskMore = useCallback(
    async (answers: ClarifyAnswer[]) => {
      setLoadingMore(true);

      // Add the last answer to history
      const lastAnswer = answers[answers.length - 1];
      if (lastAnswer) {
        const value = optionValuesRef.current.get(lastAnswer.value) || lastAnswer.value;
        historyRef.current.push({
          role: "user",
          content: value,
        });
      }

      try {
        let res = await fetch("/api/shop/refine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: queryParam,
            history: historyRef.current,
          }),
        });
        let data = await res.json();

        // If the refiner says "ready" but user clicked "Ask me more",
        // override: tell it which dimensions are covered and ask for a NEW one
        if (data.type === "ready" && !data.error) {
          const coveredDimensions = answers.map((a) => a.label).join(", ");
          historyRef.current.push({
            role: "user",
            content: `I want to keep narrowing down. I've already answered about: ${coveredDimensions}. Ask me about a COMPLETELY DIFFERENT dimension I haven't covered yet — like budget, brand, material, color, size, or specific features. Do NOT repeat any topic I already answered.`,
          });
          res = await fetch("/api/shop/refine", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: queryParam,
              history: historyRef.current,
            }),
          });
          data = await res.json();

          // If it STILL says ready after the nudge, then complete
          if (data.type === "ready" || data.error) {
            const q = data.refinedQuery || `${queryParam} ${answers.map((a) => a.value).join(" ")}`;
            setRefinedQuery(q);
            setCollectedAnswers(answers);
            setCompleted(true);
            setTimeout(() => {
              window.location.href = `/board_test?query=${encodeURIComponent(q)}`;
            }, 2500);
            return;
          }
        }

        if (data.error) {
          const q = `${queryParam} ${answers.map((a) => a.value).join(" ")}`;
          setRefinedQuery(q);
          setCollectedAnswers(answers);
          setCompleted(true);
          setTimeout(() => {
            window.location.href = `/board_test?query=${encodeURIComponent(q)}`;
          }, 2500);
          return;
        }

        // New question — append to refinements
        if (data.question) {
          historyRef.current.push({
            role: "assistant",
            content: data.question,
          });
        }
        if (Array.isArray(data.options)) {
          for (const opt of data.options) {
            optionValuesRef.current.set(opt.label, opt.value || opt.label);
          }
        }

        setRefinements((prev) => [...prev, refineResponseToRefinement(data)]);
      } catch {
        // On error, just proceed with what we have
        const q = `${queryParam} ${answers.map((a) => a.value).join(" ")}`;
        setRefinedQuery(q);
        setCollectedAnswers(answers);
        setCompleted(true);
        setTimeout(() => {
          window.location.href = `/board_test?query=${encodeURIComponent(q)}`;
        }, 2500);
      } finally {
        setLoadingMore(false);
      }
    },
    [queryParam, router]
  );

  function handleComplete(query: string, answers: ClarifyAnswer[]) {
    // Add final answer to history and call refine with forceSearch
    const lastAnswer = answers[answers.length - 1];
    if (lastAnswer) {
      const value = optionValuesRef.current.get(lastAnswer.value) || lastAnswer.value;
      historyRef.current.push({ role: "user", content: value });
    }

    // Fire forceSearch to get optimized search queries
    (async () => {
      try {
        const res = await fetch("/api/shop/refine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: queryParam,
            history: historyRef.current,
            forceSearch: true,
          }),
        });
        const data = await res.json();
        const q = data.refinedQuery || query;
        setRefinedQuery(q);
        setCollectedAnswers(answers);
        setCompleted(true);
        setTimeout(() => {
          window.location.href = `/board_test?query=${encodeURIComponent(q)}`;
        }, 2500);
      } catch {
        setRefinedQuery(query);
        setCollectedAnswers(answers);
        setCompleted(true);
        setTimeout(() => {
          window.location.href = `/board_test?query=${encodeURIComponent(query)}`;
        }, 2500);
      }
    })();
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: "linear-gradient(180deg, #87CEEB 0%, #B0E0FF 40%, #C8E6B0 65%, #98D982 70%, #5EAA42 85%, #4A8C34 100%)",
        }}
      >
        <p style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: "#8B6914" }}>
          Sniffing...
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "linear-gradient(180deg, #87CEEB 0%, #B0E0FF 40%, #C8E6B0 65%, #98D982 70%, #5EAA42 85%, #4A8C34 100%)",
      }}
    >
      {/* Pixel header bar */}
      <header
        className="relative z-30 flex shrink-0 items-center gap-4 px-5 py-2.5"
        style={{
          borderBottom: "4px solid #1A1A1A",
          background: "#8B6914",
          boxShadow: "0 4px 0 #6B5210",
        }}
      >
        <div
          className="flex h-7 w-7 items-center justify-center"
          style={{ border: "2px solid #1A1A1A", background: "#FFD700" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
        </div>
        <span style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: "#FFF8E8" }}>
          Sniff
        </span>

        <div className="mx-3 h-5 w-[3px]" style={{ background: "#6B5210" }} />

        <div
          className="flex min-w-0 flex-1 items-center gap-2 px-3 py-1.5"
          style={{ border: "2px solid #1A1A1A", background: "#FFF8E8" }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8B6914" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <span
            className="truncate"
            style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: "#4A3A2A" }}
          >
            {queryParam}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3"
            style={{
              background: "#FFD700",
              animation: completed ? "none" : "pixel-blink 1s steps(1) infinite",
            }}
          />
          <span
            style={{
              fontFamily: PIXEL_FONT,
              fontSize: 7,
              color: completed ? "#00CC00" : "#FFD700",
            }}
          >
            {completed ? "READY" : "ASKING"}
          </span>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        {!completed ? (
          <ClarifyingQuestions
            query={queryParam}
            refinements={refinements}
            productName={productName}
            onComplete={handleComplete}
            onAskMore={handleAskMore}
            loadingMore={loadingMore}
          />
        ) : (
          /* Post-completion: show refined query */
          <div
            className="pixel-frame p-8 flex flex-col items-center gap-4"
            style={{ animation: "clarify-card-enter 0.4s ease-out both" }}
          >
            <h2
              style={{
                fontFamily: PIXEL_FONT,
                fontSize: 10,
                color: "#00CC00",
              }}
            >
              QUEST ACCEPTED
            </h2>
            <div
              className="w-full px-4 py-3"
              style={{
                border: "2px solid #1A1A1A",
                background: "#FFFFFF",
              }}
            >
              <p
                style={{
                  fontFamily: PIXEL_FONT,
                  fontSize: 7,
                  color: "#4A3A2A",
                }}
              >
                Refined query:
              </p>
              <p
                className="mt-2"
                style={{
                  fontFamily: PIXEL_FONT,
                  fontSize: 8,
                  color: "#FF6B00",
                }}
              >
                &quot;{refinedQuery}&quot;
              </p>
            </div>
            <div className="w-full">
              <p
                className="mb-2"
                style={{
                  fontFamily: PIXEL_FONT,
                  fontSize: 6,
                  color: "#8B6914",
                }}
              >
                ANSWERS:
              </p>
              {collectedAnswers.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 mb-1"
                >
                  <span
                    style={{
                      fontFamily: PIXEL_FONT,
                      fontSize: 6,
                      color: "#8B6914",
                    }}
                  >
                    {a.label}:
                  </span>
                  <span
                    style={{
                      fontFamily: PIXEL_FONT,
                      fontSize: 6,
                      color: "#1A1A1A",
                    }}
                  >
                    {a.value}
                  </span>
                </div>
              ))}
            </div>
            <p
              className="text-center mt-2"
              style={{
                fontFamily: PIXEL_FONT,
                fontSize: 6,
                color: "#6B7280",
              }}
            >
              Launching quest...
            </p>
          </div>
        )}
      </div>

      {/* Grass / dirt divider at bottom */}
      <div className="shrink-0">
        <div className="h-[4px] w-full" style={{ background: "#1A1A1A" }} />
        <div
          className="h-6 w-full"
          style={{
            background: "repeating-linear-gradient(90deg, #4A8C34 0px, #4A8C34 8px, #5EAA42 8px, #5EAA42 16px)",
            imageRendering: "pixelated",
          }}
        />
        <div
          className="h-8 w-full"
          style={{
            background:
              "linear-gradient(to bottom, #8B7355, #C4A46C)",
          }}
        />
      </div>
    </div>
  );
}
