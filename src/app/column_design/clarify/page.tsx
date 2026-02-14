"use client";

import { useState } from "react";
import { ClarifyingQuestions } from "@/components/clarify/ClarifyingQuestions";
import type { Refinement, ClarifyAnswer } from "@/types/clarify";
import "./clarify.css";

// ── Mock Data — Simulates /api/clarify response for a vague query ────────

const MOCK_QUERY = "jacket";
const MOCK_PRODUCT_NAME = "jacket";

const MOCK_REFINEMENTS: Refinement[] = [
  {
    label: "Style",
    options: ["Winter Puffer", "Leather", "Rain Jacket", "Denim"],
  },
  {
    label: "Budget",
    options: ["Under $50", "$50 – $100", "$100 – $200", "Over $200"],
  },
  {
    label: "Size",
    options: ["S", "M", "L", "XL"],
  },
  {
    label: "Color",
    options: ["Black", "Navy", "Olive", "Brown"],
  },
  {
    label: "Brand",
    options: ["Nike", "North Face", "Patagonia", "No preference"],
  },
];

const PIXEL_FONT = "'Press Start 2P', monospace";

// ── Page ─────────────────────────────────────────────────────────────────

export default function ClarifyTestPage() {
  const [completed, setCompleted] = useState(false);
  const [refinedQuery, setRefinedQuery] = useState("");
  const [collectedAnswers, setCollectedAnswers] = useState<ClarifyAnswer[]>([]);

  function handleComplete(query: string, answers: ClarifyAnswer[]) {
    setRefinedQuery(query);
    setCollectedAnswers(answers);
    setCompleted(true);
    console.log("Refined query:", query);
    console.log("Answers:", answers);
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
            {MOCK_QUERY}
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
            query={MOCK_QUERY}
            refinements={MOCK_REFINEMENTS}
            productName={MOCK_PRODUCT_NAME}
            onComplete={handleComplete}
          />
        ) : (
          /* Post-completion: show refined query (in real app, would navigate to /board_test) */
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
              ✓ QUEST ACCEPTED
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
              In production, information has been sent to research.
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
