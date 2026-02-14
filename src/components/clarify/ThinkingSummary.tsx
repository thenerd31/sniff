"use client";

import { useState, useEffect, useCallback } from "react";
import type { ClarifyAnswer } from "@/types/clarify";

interface ThinkingSummaryProps {
  productName: string;
  answers: ClarifyAnswer[];
  onContinue: () => void;   // user wants more questions
  onSatisfied: () => void;  // user is happy, go to research
}

const PIXEL_FONT = "'Press Start 2P', monospace";

/**
 * ThinkingSummary — Shows after each answer. The agent displays its current
 * understanding of the product and the user decides:
 *   "Good to go!" → proceed to research
 *   "Ask me more"  → agent asks another question
 */
export function ThinkingSummary({
  productName,
  answers,
  onContinue,
  onSatisfied,
}: ThinkingSummaryProps) {
  const [typedText, setTypedText] = useState("");
  const [typingDone, setTypingDone] = useState(false);

  // Build the "thinking" summary string
  const summaryParts = answers.map((a) => a.value);
  const summaryText = `I'm looking for a ${summaryParts.join(", ")} ${productName}.`;

  // Typing animation for the summary
  useEffect(() => {
    setTypedText("");
    setTypingDone(false);

    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i <= summaryText.length) {
        setTypedText(summaryText.slice(0, i));
      } else {
        setTypingDone(true);
        clearInterval(interval);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [summaryText]);

  const handleSatisfied = useCallback(() => {
    onSatisfied();
  }, [onSatisfied]);

  const handleContinue = useCallback(() => {
    onContinue();
  }, [onContinue]);

  return (
    <div
      className="w-full max-w-xl mx-auto"
      style={{ animation: "clarify-card-enter 0.4s ease-out both" }}
    >
      <div className="pixel-frame p-8">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div
            className="h-3 w-3"
            style={{
              background: "#FFD700",
              animation: "typing-cursor-blink 1s steps(1) infinite",
            }}
          />
          <span
            style={{
              fontFamily: PIXEL_FONT,
              fontSize: 8,
              color: "#8B6914",
            }}
          >
            CURRENT UNDERSTANDING
          </span>
        </div>

        {/* What the agent has gathered so far */}
        <div className="mb-3">
          {answers.map((a, i) => (
            <div
              key={i}
              className="flex items-center gap-2 mb-2"
              style={{ animation: `option-pop 0.2s ease-out ${i * 0.06}s both` }}
            >
              <div
                className="px-2 py-1 shrink-0"
                style={{
                  fontFamily: PIXEL_FONT,
                  fontSize: 6,
                  color: "#FFF8E8",
                  background: "#8B6914",
                  border: "2px solid #1A1A1A",
                }}
              >
                {a.label.toUpperCase()}
              </div>
              <span
                style={{
                  fontFamily: PIXEL_FONT,
                  fontSize: 8,
                  color: "#FF6B00",
                }}
              >
                {a.value}
              </span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div
          className="w-full my-4"
          style={{
            height: 3,
            background: "repeating-linear-gradient(90deg, #1A1A1A 0px, #1A1A1A 4px, transparent 4px, transparent 8px)",
          }}
        />

        {/* Agent's thinking — typed out */}
        <div className="mb-6 min-h-[40px]">
          <p
            style={{
              fontFamily: PIXEL_FONT,
              fontSize: 9,
              color: "#1A1A1A",
              lineHeight: 1.8,
            }}
          >
            &quot;{typedText}&quot;
            {!typingDone && (
              <span
                style={{
                  display: "inline-block",
                  width: 8,
                  height: 12,
                  background: "#1A1A1A",
                  marginLeft: 2,
                  verticalAlign: "middle",
                  animation: "typing-cursor-blink 0.6s steps(1) infinite",
                }}
              />
            )}
          </p>
        </div>

        {/* Prompt */}
        {typingDone && (
          <div style={{ animation: "option-pop 0.3s ease-out both" }}>
            <p
              className="text-center mb-4"
              style={{
                fontFamily: PIXEL_FONT,
                fontSize: 8,
                color: "#4A3A2A",
              }}
            >
              Is this specific enough?
            </p>

            {/* Decision buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleSatisfied}
                className="clarify-pixel-btn px-4 py-4 text-center"
                style={{
                  fontFamily: PIXEL_FONT,
                  fontSize: 9,
                  color: "#FFFFFF",
                  fontWeight: "bold",
                  background: "#FF6B00",
                  boxShadow: "0 4px 0 #CC5500",
                  animation: "option-pop 0.25s ease-out 0s both",
                }}
              >
                Good to go!
              </button>
              <button
                onClick={handleContinue}
                className="clarify-pixel-btn px-4 py-4 text-center"
                style={{
                  fontFamily: PIXEL_FONT,
                  fontSize: 9,
                  fontWeight: "bold",
                  color: "#1A1A1A",
                  animation: "option-pop 0.25s ease-out 0.08s both",
                }}
              >
                Ask me more
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
