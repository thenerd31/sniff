"use client";

/**
 * PixelDogMascot — Inline SVG pixel dog matching Davyn's design system.
 *
 * States:
 *   "sniffing"    — Head down, sniff lines, gentle bob (loading/transitioning)
 *   "asking"      — Head up, ears perked, gentle float (while question displayed)
 *   "celebrating" — Jump + tail wag (completion)
 */

interface PixelDogMascotProps {
  state: "sniffing" | "asking" | "celebrating";
  className?: string;
}

const PIXEL_FONT = "'Press Start 2P', monospace";

export function PixelDogMascot({ state, className = "" }: PixelDogMascotProps) {
  const animationStyle =
    state === "sniffing"
      ? { animation: "dog-sniff 1.2s ease-in-out infinite" }
      : state === "celebrating"
      ? { animation: "dog-celebrate 0.5s ease-out both" }
      : { animation: "gentle-float 2s ease-in-out infinite" };

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      {/* Dog sprite */}
      <div style={animationStyle}>
        <svg
          width="64"
          height="48"
          viewBox="0 0 32 24"
          style={{ imageRendering: "pixelated" }}
        >
          {/* Body */}
          <rect x="8" y="10" width="16" height="8" fill="#D4A574" />
          <rect x="9" y="11" width="14" height="6" fill="#D4A574" />
          {/* Body shadow */}
          <rect x="8" y="16" width="16" height="2" fill="#C49464" />
          {/* Belly spot */}
          <rect x="12" y="14" width="6" height="3" fill="#E8C49C" />

          {/* Head */}
          <rect x="20" y="4" width="8" height="8" fill="#D4A574" />
          <rect x="21" y="5" width="6" height="6" fill="#D4A574" />

          {/* Ears */}
          <rect x="20" y="2" width="3" height="4" fill="#8B6914" />
          <rect x="26" y="2" width="3" height="4" fill="#8B6914" />

          {/* Eyes */}
          {state === "sniffing" ? (
            <>
              {/* Squinting eyes for sniffing */}
              <rect x="22" y="7" width="2" height="1" fill="#1A1A1A" />
              <rect x="25" y="7" width="2" height="1" fill="#1A1A1A" />
            </>
          ) : (
            <>
              {/* Open eyes */}
              <rect x="22" y="6" width="2" height="2" fill="#1A1A1A" />
              <rect x="25" y="6" width="2" height="2" fill="#1A1A1A" />
              {/* Eye highlights */}
              <rect x="22" y="6" width="1" height="1" fill="#FFFFFF" />
              <rect x="25" y="6" width="1" height="1" fill="#FFFFFF" />
            </>
          )}

          {/* Nose */}
          <rect x="27" y="8" width="2" height="2" fill="#1A1A1A" />

          {/* Mouth */}
          <rect x="27" y="10" width="1" height="1" fill="#C49464" />

          {/* Collar */}
          <rect x="19" y="11" width="3" height="2" fill="#FF0000" />
          <rect x="20" y="12" width="1" height="1" fill="#FFD700" />

          {/* Legs */}
          <rect x="10" y="18" width="3" height="4" fill="#D4A574" />
          <rect x="14" y="18" width="3" height="4" fill="#D4A574" />
          <rect x="18" y="18" width="3" height="4" fill="#D4A574" />
          <rect x="22" y="18" width="3" height="4" fill="#C49464" />

          {/* Paws */}
          <rect x="9" y="21" width="5" height="2" fill="#C49464" />
          <rect x="13" y="21" width="5" height="2" fill="#C49464" />
          <rect x="17" y="21" width="5" height="2" fill="#C49464" />
          <rect x="21" y="21" width="5" height="2" fill="#C49464" />

          {/* Tail */}
          <rect x="5" y="8" width="4" height="3" fill="#8B6914" />
          <rect x="4" y="7" width="3" height="2" fill="#8B6914" />

          {/* Sniff lines (only when sniffing) */}
          {state === "sniffing" && (
            <>
              <rect
                x="29" y="7" width="2" height="1"
                fill="#8B6914"
                opacity="0.6"
                style={{ animation: "sniff-lines 0.8s ease-in-out infinite" }}
              />
              <rect
                x="30" y="9" width="2" height="1"
                fill="#8B6914"
                opacity="0.4"
                style={{ animation: "sniff-lines 0.8s ease-in-out infinite 0.2s" }}
              />
            </>
          )}
        </svg>
      </div>

      {/* Speech indicator */}
      {state === "sniffing" && (
        <p
          className="mt-1 text-center"
          style={{
            fontFamily: PIXEL_FONT,
            fontSize: 6,
            color: "#8B6914",
            animation: "typing-cursor-blink 0.8s steps(1) infinite",
          }}
        >
          *sniff sniff*
        </p>
      )}
    </div>
  );
}
