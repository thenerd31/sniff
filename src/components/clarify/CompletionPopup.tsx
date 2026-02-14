"use client";

import { useEffect, useRef } from "react";
import { PixelDogMascot } from "./PixelDogMascot";

interface CompletionPopupProps {
  productName: string;
  onComplete: () => void;
}

const PIXEL_FONT = "'Press Start 2P', monospace";
const TOTAL_SEGMENTS = 10;
const FILL_DURATION = 1800; // ms total for progress bar
const COMPLETE_DELAY = 2100; // ms before onComplete fires

/**
 * CompletionPopup — "All set!" transition overlay before research board.
 *
 * Shows pixel-styled popup with:
 *   - "ALL SET!" header
 *   - Dog mascot celebrating
 *   - Segmented progress bar filling over 1.8s
 *   - Fires onComplete after 2.1s
 */
export function CompletionPopup({ productName, onComplete }: CompletionPopupProps) {
  const firedRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!firedRef.current) {
        firedRef.current = true;
        onComplete();
      }
    }, COMPLETE_DELAY);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        animation: "completion-overlay-in 0.3s ease-out both",
      }}
    >
      {/* Dimmed background */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0, 0, 0, 0.35)" }}
      />

      {/* Popup card */}
      <div
        className="relative pixel-frame p-8 flex flex-col items-center gap-5"
        style={{
          animation: "completion-enter 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both",
          minWidth: 340,
          maxWidth: 420,
        }}
      >
        {/* ALL SET header */}
        <h2
          style={{
            fontFamily: PIXEL_FONT,
            fontSize: 14,
            color: "#FFD700",
            textShadow: "2px 2px 0 #8B6914",
          }}
        >
          ALL SET!
        </h2>

        {/* Dog celebrating */}
        <PixelDogMascot state="celebrating" />

        {/* Subtitle */}
        <p
          className="text-center"
          style={{
            fontFamily: PIXEL_FONT,
            fontSize: 7,
            color: "#4A3A2A",
            lineHeight: 1.8,
          }}
        >
          Sniffing out the best
          <br />
          <span style={{ color: "#FF6B00" }}>{productName}</span> deals...
        </p>

        {/* Pixel progress bar */}
        <div
          className="w-full"
          style={{
            border: "3px solid #1A1A1A",
            background: "#2A2A2A",
            padding: 3,
            height: 24,
          }}
        >
          <div className="flex gap-[2px] h-full">
            {Array.from({ length: TOTAL_SEGMENTS }).map((_, i) => (
              <div
                key={i}
                className="flex-1 h-full"
                style={{
                  background: "#FF6B00",
                  animation: `segment-flash 0.15s ease-out ${
                    (i / TOTAL_SEGMENTS) * FILL_DURATION
                  }ms both`,
                  opacity: 0,
                }}
              />
            ))}
          </div>
        </div>

        {/* Loading text */}
        <p
          style={{
            fontFamily: PIXEL_FONT,
            fontSize: 6,
            color: "#8B6914",
            animation: "typing-cursor-blink 0.8s steps(1) infinite",
          }}
        >
          Searching retailers...
        </p>
      </div>
    </div>
  );
}
