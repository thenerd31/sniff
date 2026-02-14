"use client";

import { useState, useCallback, useEffect } from "react";
import { PixelDogMascot } from "./PixelDogMascot";
import { QuestionCard } from "./QuestionCard";
import { CompletionPopup } from "./CompletionPopup";
import type { Refinement, ClarifyAnswer, ClarifyPhase } from "@/types/clarify";

interface ClarifyingQuestionsProps {
  query: string;
  refinements: Refinement[];
  productName: string;
  onComplete: (refinedQuery: string, answers: ClarifyAnswer[]) => void;
}

const PIXEL_FONT = "'Press Start 2P', monospace";

/**
 * ClarifyingQuestions — Main orchestrator for the clarifying questions flow.
 *
 * Flow:
 *   1. "loading" phase — dog sniffing, brief thinking pause (0.8s)
 *   2. "asking" phase — questions presented one at a time
 *   3. "completing" phase — "ALL SET!" popup with progress bar
 *   4. "done" — onComplete fires with refined query
 *
 * Isolated from Davyn's files. Davyn imports this component and passes
 * refinements from /api/clarify. onComplete returns the refined query string.
 */
export function ClarifyingQuestions({
  query,
  refinements,
  productName,
  onComplete,
}: ClarifyingQuestionsProps) {
  const [phase, setPhase] = useState<ClarifyPhase>("loading");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<ClarifyAnswer[]>([]);
  const [cardKey, setCardKey] = useState(0); // forces remount for CSS animation
  const [exiting, setExiting] = useState(false);

  // Loading → asking after 0.8s
  useEffect(() => {
    if (phase !== "loading") return;
    const timer = setTimeout(() => setPhase("asking"), 800);
    return () => clearTimeout(timer);
  }, [phase]);

  const handleAnswer = useCallback(
    (value: string) => {
      const newAnswer: ClarifyAnswer = {
        label: refinements[currentIndex].label,
        value,
      };
      const updatedAnswers = [...answers, newAnswer];
      setAnswers(updatedAnswers);

      // Start exit animation
      setExiting(true);

      if (currentIndex < refinements.length - 1) {
        // More questions — transition to next after exit animation
        setTimeout(() => {
          setExiting(false);
          setCurrentIndex((prev) => prev + 1);
          setCardKey((prev) => prev + 1);
        }, 400);
      } else {
        // Last question answered — go to completing phase
        setTimeout(() => {
          setExiting(false);
          setPhase("completing");
        }, 400);
      }
    },
    [currentIndex, refinements, answers]
  );

  const handleCompletionDone = useCallback(() => {
    setPhase("done");
    // Build refined query: "productName answer1 answer2 answer3"
    const allAnswers = [...answers];
    // answers is stale here since handleAnswer updates it, but completing fires after all answers collected
    const refinedQuery = `${productName} ${allAnswers.map((a) => a.value).join(" ")}`;
    onComplete(refinedQuery, allAnswers);
  }, [productName, answers, onComplete]);

  // Determine dog state
  const dogState =
    phase === "loading"
      ? "sniffing"
      : phase === "completing" || phase === "done"
      ? "celebrating"
      : "asking";

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* Loading phase — dog sniffing */}
      {phase === "loading" && (
        <div
          className="flex flex-col items-center gap-4 py-12"
          style={{ animation: "clarify-card-enter 0.3s ease-out both" }}
        >
          <PixelDogMascot state="sniffing" />
          <p
            style={{
              fontFamily: PIXEL_FONT,
              fontSize: 8,
              color: "#8B6914",
            }}
          >
            Let me think...
          </p>
        </div>
      )}

      {/* Asking phase — one question at a time */}
      {phase === "asking" && (
        <div className="w-full flex flex-col items-center gap-6 py-8">
          {/* Dog mascot floats beside on larger screens */}
          <div className="flex items-start gap-8 w-full max-w-2xl px-4">
            <div className="hidden md:flex flex-col items-center pt-12 shrink-0">
              <PixelDogMascot state={dogState} />
            </div>

            {/* Question area */}
            <div
              className="flex-1 min-w-0"
              style={
                exiting
                  ? { animation: "clarify-card-exit 0.3s ease-in forwards" }
                  : undefined
              }
            >
              {/* Mobile dog — above the card */}
              <div className="flex md:hidden justify-center mb-4">
                <PixelDogMascot state={dogState} />
              </div>

              <QuestionCard
                key={cardKey}
                refinement={refinements[currentIndex]}
                questionNumber={currentIndex + 1}
                totalQuestions={refinements.length}
                isLast={currentIndex === refinements.length - 1}
                onAnswer={handleAnswer}
              />
            </div>
          </div>

          {/* Contextual hint */}
          <p
            className="text-center mt-2"
            style={{
              fontFamily: PIXEL_FONT,
              fontSize: 6,
              color: "#6B7280",
            }}
          >
            Searching for: <span style={{ color: "#FF6B00" }}>{productName}</span>
          </p>
        </div>
      )}

      {/* Completing phase — popup overlay */}
      {phase === "completing" && (
        <CompletionPopup
          productName={productName}
          onComplete={handleCompletionDone}
        />
      )}
    </div>
  );
}
