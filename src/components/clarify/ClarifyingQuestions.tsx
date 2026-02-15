"use client";

import { useState, useCallback, useEffect } from "react";
import { PixelDogMascot } from "./PixelDogMascot";
import { QuestionCard } from "./QuestionCard";
import { ThinkingSummary } from "./ThinkingSummary";
import { CompletionPopup } from "./CompletionPopup";
import type { Refinement, ClarifyAnswer, ClarifyPhase } from "@/types/clarify";

interface ClarifyingQuestionsProps {
  query: string;
  refinements: Refinement[];
  productName: string;
  onComplete: (refinedQuery: string, answers: ClarifyAnswer[]) => void;
  /** Called when user clicks "Ask me more" and all current refinements are exhausted.
   *  The parent should fetch a new question and append it to the refinements list. */
  onAskMore?: (answers: ClarifyAnswer[]) => void;
  /** True while the parent is fetching the next question from the API. */
  loadingMore?: boolean;
}

const PIXEL_FONT = "'Press Start 2P', monospace";

/**
 * ClarifyingQuestions — Conversational loop orchestrator.
 *
 * Flow:
 *   1. "loading"   — dog sniffing, brief pause
 *   2. "asking"    — show a question card, user picks an option
 *   3. "reviewing" — agent shows its current understanding, user picks
 *                     "Good to go!" → completing, or "Ask me more" → next question
 *   4. "completing" — "ALL SET!" popup
 *   5. "done"      — onComplete fires
 *
 * The user controls when to stop. The agent keeps asking until the user
 * is satisfied or all pre-generated refinements are exhausted (for the demo).
 */
export function ClarifyingQuestions({
  query,
  refinements,
  productName,
  onComplete,
  onAskMore,
  loadingMore,
}: ClarifyingQuestionsProps) {
  const [phase, setPhase] = useState<ClarifyPhase | "reviewing">("loading");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<ClarifyAnswer[]>([]);
  const [cardKey, setCardKey] = useState(0);
  const [exiting, setExiting] = useState(false);

  // Loading → asking after 0.8s (initial load or waiting for new question)
  useEffect(() => {
    if (phase !== "loading") return;
    // If we're waiting for the parent to fetch a new question, don't auto-advance
    if (loadingMore) return;
    // If a new refinement is available at the next index, advance to it
    const nextIndex = currentIndex + 1;
    if (nextIndex < refinements.length && answers.length > 0) {
      const timer = setTimeout(() => {
        setCurrentIndex(nextIndex);
        setPhase("asking");
        setCardKey((prev) => prev + 1);
      }, 400);
      return () => clearTimeout(timer);
    }
    // First load
    const timer = setTimeout(() => setPhase("asking"), 800);
    return () => clearTimeout(timer);
  }, [phase, loadingMore, refinements.length, currentIndex, answers.length]);

  // User answers a question → transition to "reviewing"
  const handleAnswer = useCallback(
    (value: string) => {
      const newAnswer: ClarifyAnswer = {
        label: refinements[currentIndex].label,
        value,
      };
      const updatedAnswers = [...answers, newAnswer];
      setAnswers(updatedAnswers);

      // Exit animation then show thinking summary
      setExiting(true);
      setTimeout(() => {
        setExiting(false);
        setPhase("reviewing");
        setCardKey((prev) => prev + 1);
      }, 400);
    },
    [currentIndex, refinements, answers]
  );

  // User clicks "Good to go!" → go to completing
  const handleSatisfied = useCallback(() => {
    setExiting(true);
    setTimeout(() => {
      setExiting(false);
      setPhase("completing");
    }, 400);
  }, []);

  // User clicks "Ask me more" → next question, fetch more, or force complete
  const handleContinue = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < refinements.length) {
      // There's already a next question queued up
      setExiting(true);
      setTimeout(() => {
        setExiting(false);
        setCurrentIndex(nextIndex);
        setPhase("asking");
        setCardKey((prev) => prev + 1);
      }, 400);
    } else if (onAskMore) {
      // Ask the parent to fetch a new question from the API
      setExiting(true);
      setTimeout(() => {
        setExiting(false);
        setPhase("loading");
      }, 400);
      onAskMore(answers);
    } else {
      // No callback — auto-complete (backwards compat)
      setExiting(true);
      setTimeout(() => {
        setExiting(false);
        setPhase("completing");
      }, 400);
    }
  }, [currentIndex, refinements.length, onAskMore, answers]);

  // Completion popup done → fire onComplete
  const handleCompletionDone = useCallback(() => {
    setPhase("done");
    const refinedQuery = `${productName} ${answers.map((a) => a.value).join(" ")}`;
    onComplete(refinedQuery, answers);
  }, [productName, answers, onComplete]);

  // Dog state
  const dogState =
    phase === "loading"
      ? "sniffing"
      : phase === "completing" || phase === "done"
      ? "celebrating"
      : phase === "reviewing"
      ? "sniffing"
      : "asking";

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* Loading phase */}
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

      {/* Asking phase — question card */}
      {phase === "asking" && (
        <div className="w-full flex flex-col items-center gap-6 py-8">
          <div className="flex items-start gap-8 w-full max-w-2xl px-4">
            <div className="hidden md:flex flex-col items-center pt-12 shrink-0">
              <PixelDogMascot state={dogState} />
            </div>

            <div
              className="flex-1 min-w-0"
              style={
                exiting
                  ? { animation: "clarify-card-exit 0.3s ease-in forwards" }
                  : undefined
              }
            >
              <div className="flex md:hidden justify-center mb-4">
                <PixelDogMascot state={dogState} />
              </div>

              <QuestionCard
                key={cardKey}
                refinement={refinements[currentIndex]}
                questionNumber={currentIndex + 1}
                onAnswer={handleAnswer}
              />
            </div>
          </div>

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

      {/* Reviewing phase — agent shows understanding, user decides */}
      {phase === "reviewing" && (
        <div className="w-full flex flex-col items-center gap-6 py-8">
          <div className="flex items-start gap-8 w-full max-w-2xl px-4">
            <div className="hidden md:flex flex-col items-center pt-12 shrink-0">
              <PixelDogMascot state={dogState} />
            </div>

            <div
              className="flex-1 min-w-0"
              style={
                exiting
                  ? { animation: "clarify-card-exit 0.3s ease-in forwards" }
                  : undefined
              }
            >
              <div className="flex md:hidden justify-center mb-4">
                <PixelDogMascot state={dogState} />
              </div>

              <ThinkingSummary
                key={`summary-${cardKey}`}
                productName={productName}
                answers={answers}
                onContinue={handleContinue}
                onSatisfied={handleSatisfied}
              />
            </div>
          </div>

          {/* Show how many questions answered */}
          <p
            className="text-center mt-2"
            style={{
              fontFamily: PIXEL_FONT,
              fontSize: 6,
              color: "#6B7280",
            }}
          >
            {answers.length} question{answers.length !== 1 ? "s" : ""} answered
            {currentIndex + 1 < refinements.length && (
              <span style={{ color: "#8B6914" }}> · more available</span>
            )}
          </p>
        </div>
      )}

      {/* Completing phase */}
      {phase === "completing" && (
        <CompletionPopup
          productName={productName}
          onComplete={handleCompletionDone}
        />
      )}
    </div>
  );
}
