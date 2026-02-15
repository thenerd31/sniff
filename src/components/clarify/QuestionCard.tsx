"use client";

import { useState, useEffect, useCallback } from "react";
import type { Refinement } from "@/types/clarify";

interface QuestionCardProps {
  refinement: Refinement;
  questionNumber: number;
  onAnswer: (value: string) => void;
}

const PIXEL_FONT = "'Press Start 2P', monospace";

/**
 * QuestionCard — A single clarifying question with pixel-themed UI.
 *
 * Simplified: no "last question" badge, no total count (user decides when done).
 * Just shows the question number, typing animation, and option buttons.
 */
export function QuestionCard({
  refinement,
  questionNumber,
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

  // Typing animation
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
      if (selectedValue) return;
      setSelectedValue(value);
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

  const gridCols = refinement.options.length >= 4 ? "grid-cols-2" : "grid-cols-1";

  return (
    <div
      className="w-full max-w-xl mx-auto"
      style={{ animation: "clarify-card-enter 0.4s ease-out both" }}
    >
      {/* Main pixel frame card */}
      <div className="pixel-frame p-8">
        {/* Question counter */}
        <div className="flex items-center justify-between mb-4">
          <span
            style={{
              fontFamily: PIXEL_FONT,
              fontSize: 9,
              color: "#8B6914",
            }}
          >
            Q{questionNumber}
          </span>
        </div>

        {/* Category label */}
        <div
          className="inline-block px-4 py-1.5 mb-4"
          style={{
            fontFamily: PIXEL_FONT,
            fontSize: 9,
            color: "#FFF8E8",
            background: "#8B6914",
            border: "2px solid #1A1A1A",
          }}
        >
          {refinement.label.toUpperCase()}
        </div>

        {/* Question text with typing animation */}
        <div className="mb-6 min-h-[40px]">
          <p
            style={{
              fontFamily: PIXEL_FONT,
              fontSize: 11,
              color: "#1A1A1A",
              lineHeight: 1.7,
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

        {/* Options — Buttons */}
        {typingDone && !isSpectrum && (
          <div className={`grid ${gridCols} gap-3`}>
            {refinement.options.map((option, i) => (
              <button
                key={option}
                onClick={() => handleOptionClick(option)}
                disabled={!!selectedValue}
                className={`clarify-pixel-btn px-5 py-4 text-center ${
                  selectedValue === option ? "selected" : ""
                }`}
                style={{
                  fontFamily: PIXEL_FONT,
                  fontSize: 10,
                  color: selectedValue === option ? "#FFFFFF" : "#1A1A1A",
                  fontWeight: "bold",
                  letterSpacing: "0.5px",
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
          <div style={{ animation: "option-pop 0.3s ease-out both" }}>
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

            <div className="flex justify-between mb-4">
              <span style={{ fontFamily: PIXEL_FONT, fontSize: 6, color: "#8B6914" }}>
                ${refinement.spectrumRange[0]}
              </span>
              <span style={{ fontFamily: PIXEL_FONT, fontSize: 6, color: "#8B6914" }}>
                ${refinement.spectrumRange[1]}
              </span>
            </div>

            <button
              onClick={handleSpectrumConfirm}
              disabled={!!selectedValue}
              className={`clarify-pixel-btn w-full px-4 py-3 text-center ${
                selectedValue ? "selected" : ""
              }`}
              style={{ fontFamily: PIXEL_FONT, fontSize: 8 }}
            >
              {selectedValue ? `✓ $${sliderValue}` : `Set Budget: $${sliderValue}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
