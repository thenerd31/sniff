"use client";

import { useState, useEffect, useCallback } from "react";
import type { Refinement } from "@/types/clarify";

interface QuestionCardProps {
  refinement: Refinement;
  questionNumber: number;
  totalQuestions: number;
  isLast: boolean;
  onAnswer: (value: string) => void;
}

const PIXEL_FONT = "'Press Start 2P', monospace";

/**
 * QuestionCard — A single clarifying question with pixel-themed UI.
 *
 * Features:
 *   - Typing animation for the question text
 *   - Staggered button pop-in
 *   - Optional spectrum slider for budget questions
 *   - "Last question!" badge on final question
 *   - All animations via pure CSS @keyframes
 */
export function QuestionCard({
  refinement,
  questionNumber,
  totalQuestions,
  isLast,
  onAnswer,
}: QuestionCardProps) {
  const [typedText, setTypedText] = useState("");
  const [typingDone, setTypingDone] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [sliderValue, setSliderValue] = useState(
    refinement.spectrumRange
      ? Math.round((refinement.spectrumRange[0] + refinement.spectrumRange[1]) / 2)
      : 0
  );

  const isSpectrum = refinement.type === "spectrum" && refinement.spectrumRange;
  const questionText = `What ${refinement.label.toLowerCase()} are you looking for?`;

  // Typing animation — character by character via setInterval
  useEffect(() => {
    setTypedText("");
    setTypingDone(false);
    setSelectedValue(null);

    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i <= questionText.length) {
        setTypedText(questionText.slice(0, i));
      } else {
        setTypingDone(true);
        clearInterval(interval);
      }
    }, 35);

    return () => clearInterval(interval);
  }, [questionText]);

  const handleOptionClick = useCallback(
    (value: string) => {
      if (selectedValue) return; // prevent double-clicks
      setSelectedValue(value);
      // Brief delay for the selected animation to play, then fire callback
      setTimeout(() => onAnswer(value), 350);
    },
    [selectedValue, onAnswer]
  );

  const handleSpectrumConfirm = useCallback(() => {
    if (selectedValue) return;
    const formatted = `$${sliderValue}`;
    setSelectedValue(formatted);
    setTimeout(() => onAnswer(formatted), 350);
  }, [selectedValue, sliderValue, onAnswer]);

  // Grid columns: 2 for 4+ options, 1 for fewer
  const gridCols = refinement.options.length >= 4 ? "grid-cols-2" : "grid-cols-1";

  return (
    <div
      className="w-full max-w-lg mx-auto"
      style={{
        animation: "clarify-card-enter 0.4s ease-out both",
      }}
    >
      {/* "Last question!" badge */}
      {isLast && (
        <div
          className="flex justify-center mb-3"
          style={{ animation: "badge-bounce 0.5s ease-out both" }}
        >
          <div
            className="px-4 py-2"
            style={{
              fontFamily: PIXEL_FONT,
              fontSize: 8,
              color: "#FFF8E8",
              background: "#FF6B00",
              border: "3px solid #1A1A1A",
              boxShadow: "0 3px 0 #CC5500",
            }}
          >
            ★ Last Question! ★
          </div>
        </div>
      )}

      {/* Main pixel frame card */}
      <div className="pixel-frame p-6">
        {/* Question counter */}
        <div className="flex items-center justify-between mb-4">
          <span
            style={{
              fontFamily: PIXEL_FONT,
              fontSize: 7,
              color: "#8B6914",
            }}
          >
            Q{questionNumber}/{totalQuestions}
          </span>

          {/* Progress dots */}
          <div className="flex gap-1.5">
            {Array.from({ length: totalQuestions }).map((_, i) => (
              <div
                key={i}
                className={`question-dot ${
                  i < questionNumber - 1
                    ? "completed"
                    : i === questionNumber - 1
                    ? "active"
                    : ""
                }`}
              />
            ))}
          </div>
        </div>

        {/* Category label */}
        <div
          className="inline-block px-3 py-1 mb-3"
          style={{
            fontFamily: PIXEL_FONT,
            fontSize: 7,
            color: "#FFF8E8",
            background: "#8B6914",
            border: "2px solid #1A1A1A",
          }}
        >
          {refinement.label.toUpperCase()}
        </div>

        {/* Question text with typing animation */}
        <div className="mb-5 min-h-[32px]">
          <p
            style={{
              fontFamily: PIXEL_FONT,
              fontSize: 9,
              color: "#1A1A1A",
              lineHeight: 1.6,
            }}
          >
            {typedText}
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

        {/* Options — Buttons or Spectrum */}
        {typingDone && !isSpectrum && (
          <div className={`grid ${gridCols} gap-3`}>
            {refinement.options.map((option, i) => (
              <button
                key={option}
                onClick={() => handleOptionClick(option)}
                disabled={!!selectedValue}
                className={`clarify-pixel-btn px-4 py-3 text-center ${
                  selectedValue === option ? "selected" : ""
                }`}
                style={{
                  fontFamily: PIXEL_FONT,
                  fontSize: 7,
                  animation: `option-pop 0.25s ease-out ${i * 0.08}s both${
                    selectedValue === option
                      ? `, option-selected 0.2s ease-out 0s both`
                      : ""
                  }`,
                }}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {/* Spectrum slider for budget */}
        {typingDone && isSpectrum && refinement.spectrumRange && (
          <div
            style={{ animation: "option-pop 0.3s ease-out both" }}
          >
            {/* Value display */}
            <div className="flex justify-center mb-4">
              <div
                className="px-5 py-2"
                style={{
                  fontFamily: PIXEL_FONT,
                  fontSize: 12,
                  color: "#FF6B00",
                  background: "#FFFFFF",
                  border: "3px solid #1A1A1A",
                  boxShadow: "0 3px 0 #1A1A1A",
                }}
              >
                ${sliderValue}
              </div>
            </div>

            {/* Slider */}
            <input
              type="range"
              min={refinement.spectrumRange[0]}
              max={refinement.spectrumRange[1]}
              step={10}
              value={sliderValue}
              onChange={(e) => setSliderValue(Number(e.target.value))}
              className="pixel-slider mb-3"
              disabled={!!selectedValue}
            />

            {/* Range labels */}
            <div className="flex justify-between mb-4">
              <span
                style={{ fontFamily: PIXEL_FONT, fontSize: 6, color: "#8B6914" }}
              >
                ${refinement.spectrumRange[0]}
              </span>
              <span
                style={{ fontFamily: PIXEL_FONT, fontSize: 6, color: "#8B6914" }}
              >
                ${refinement.spectrumRange[1]}
              </span>
            </div>

            {/* Confirm button */}
            <button
              onClick={handleSpectrumConfirm}
              disabled={!!selectedValue}
              className={`clarify-pixel-btn w-full px-4 py-3 text-center ${
                selectedValue ? "selected" : ""
              }`}
              style={{
                fontFamily: PIXEL_FONT,
                fontSize: 8,
              }}
            >
              {selectedValue ? `✓ $${sliderValue}` : `Set Budget: $${sliderValue}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
