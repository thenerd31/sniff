"use client";

import { useEffect, useRef } from "react";
import type { ProductWithVerdict } from "@/types";

const PIXEL_FONT = "'Press Start 2P', monospace";

interface BlackHoleWipeProps {
  flaggedProducts: ProductWithVerdict[];
  onComplete: () => void;
}

export function BlackHoleWipe({ flaggedProducts, onComplete }: BlackHoleWipeProps) {
  const completeFired = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!completeFired.current) {
        completeFired.current = true;
        onComplete();
      }
    }, 2600);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const total = flaggedProducts.length;

  return (
    <div
      className="relative w-full flex items-center justify-center overflow-hidden"
      style={{ height: 450 }}
    >
      {flaggedProducts.map((product, i) => {
        const angle = (i / Math.max(total, 1)) * Math.PI * 2;
        const r = 150;
        const cx = Math.cos(angle) * r;
        const cy = Math.sin(angle) * r;
        const spiralDelay = 1.0 + i * 0.08;

        return (
          <div
            key={product.id}
            className="absolute"
            style={{
              "--cx": `${cx}px`,
              "--cy": `${cy}px`,
              animation: `bh-card-appear 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.06}s both, bh-card-spiral 0.8s cubic-bezier(0.55, 0, 0.1, 1) ${spiralDelay}s forwards`,
            } as React.CSSProperties}
          >
            {/* Pixel-art mini card */}
            <div
              className="flex flex-col justify-between p-2.5"
              style={{
                width: 190,
                height: 110,
                border: "3px solid #8B0000",
                background: "#FFF8E8",
                boxShadow: "3px 3px 0 #1A1A1A",
                imageRendering: "pixelated",
              }}
            >
              <p
                className="line-clamp-2"
                style={{ fontFamily: PIXEL_FONT, fontSize: 6, lineHeight: 1.6, color: "#1A1A1A" }}
              >
                {product.title}
              </p>
              <div className="flex items-center justify-between">
                <span style={{ fontFamily: PIXEL_FONT, fontSize: 5, color: "#8B0000" }}>
                  {product.domain}
                </span>
                <span style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: "#FF0000" }}>
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: product.currency || "USD",
                  }).format(product.price)}
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {/* Singularity — pixel-art black hole */}
      <div
        className="absolute"
        style={{
          width: 96,
          height: 96,
          background: "radial-gradient(circle, #1A1A1A 0%, transparent 70%)",
          boxShadow:
            "0 0 60px 20px rgba(26,26,26,0.4), 0 0 120px 40px rgba(255,107,0,0.15)",
          animation:
            "bh-singularity-grow 0.5s ease-out 0.6s both, bh-singularity-collapse 0.4s ease-in 2.2s forwards",
          imageRendering: "pixelated",
        }}
      />

      {/* Label */}
      <p
        className="absolute"
        style={{
          bottom: 16,
          fontFamily: PIXEL_FONT,
          fontSize: 7,
          color: "#D4C4A0",
          animation: "label-fade-in-out 2.0s ease 0.2s both",
        }}
      >
        DESTROYING CURSED ITEMS...
      </p>
    </div>
  );
}
