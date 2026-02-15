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
 * Build a natural-sounding summary from label+value pairs.
 * Maps dimension labels to sentence fragments so the output reads like:
 *   "Looking for men's puffer jackets, around $100-200, in black."
 * instead of "I'm looking for a men's, puffer, $100-200, black jacket."
 */
function buildSummary(productName: string, answers: ClarifyAnswer[]): string {
  if (answers.length === 0) return `Looking for ${productName}.`;

  // Filter out empty/skip answers
  const meaningful = answers.filter((a) => a.value && a.value.trim() !== "");
  if (meaningful.length === 0) return `Looking for ${productName}.`;

  // Group answers by their dimension label
  const byLabel = new Map<string, string>();
  for (const a of meaningful) {
    byLabel.set(a.label.toLowerCase(), a.value);
  }

  // Build sentence parts in natural order
  const parts: string[] = [];

  // Gender/audience first (e.g. "men's", "women's")
  const gender = byLabel.get("gender") || byLabel.get("audience") || byLabel.get("who");
  if (gender) parts.push(gender);

  // Style/type (e.g. "puffer", "running")
  const style = byLabel.get("style") || byLabel.get("type") || byLabel.get("category");
  if (style) parts.push(style);

  // Product name
  parts.push(productName);

  // Build the base: "men's puffer jacket"
  let sentence = `Looking for ${parts.join(" ")}`;

  // Append other dimensions as trailing clauses
  const usedLabels = new Set(["gender", "audience", "who", "style", "type", "category"]);
  const extras: string[] = [];
  for (const a of meaningful) {
    if (usedLabels.has(a.label.toLowerCase())) continue;
    const label = a.label.toLowerCase();
    if (label.includes("budget") || label.includes("price")) {
      extras.push(`around ${a.value}`);
    } else if (label.includes("brand")) {
      extras.push(`from ${a.value}`);
    } else if (label.includes("color") || label.includes("colour")) {
      extras.push(`in ${a.value}`);
    } else if (label.includes("material")) {
      extras.push(`made of ${a.value}`);
    } else if (label.includes("use") || label.includes("occasion")) {
      extras.push(`for ${a.value}`);
    } else if (label.includes("feature")) {
      extras.push(`with ${a.value}`);
    } else if (label.includes("size") || label.includes("fit")) {
      extras.push(`${a.value} fit`);
    } else {
      extras.push(a.value);
    }
  }

  if (extras.length > 0) {
    sentence += ", " + extras.join(", ");
  }

  return sentence + ".";
}

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

  // Build an intelligent summary sentence from structured answers
  const summaryText = buildSummary(productName, answers);

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
