"use client";

import { PixelDogMascot } from "@/components/clarify/PixelDogMascot";

const PIXEL_FONT = "'Press Start 2P', monospace";

export function EmptyDashboard() {
  return (
    <div
      className="w-full max-w-xl mx-auto"
      style={{ animation: "empty-fade-in 0.5s ease-out both" }}
    >
      <div className="dash-pixel-frame p-12 flex flex-col items-center gap-8">
        <PixelDogMascot state="sniffing" />

        <h2
          className="text-center"
          style={{
            fontFamily: PIXEL_FONT,
            fontSize: 14,
            color: "#8B6914",
          }}
        >
          NO SAVED ITEMS YET
        </h2>

        <p
          className="text-center"
          style={{
            fontFamily: PIXEL_FONT,
            fontSize: 9,
            color: "#4A3A2A",
            lineHeight: 2.2,
            maxWidth: 400,
          }}
        >
          Bookmark products from your search results and they&apos;ll appear
          here!
        </p>

        <div
          className="h-[3px] w-full my-2"
          style={{
            background:
              "repeating-linear-gradient(90deg, #1A1A1A 0px, #1A1A1A 4px, transparent 4px, transparent 8px)",
          }}
        />

        <p
          className="text-center"
          style={{
            fontFamily: PIXEL_FONT,
            fontSize: 8,
            color: "#6B7280",
            lineHeight: 2.2,
          }}
        >
          Save items during the results phase to build your collection.
        </p>
      </div>
    </div>
  );
}
