"use client";

import { useEffect, useRef } from "react";
import type { ProductWithVerdict } from "@/types";

interface BlackHoleWipeProps {
  flaggedProducts: ProductWithVerdict[];
  onComplete: () => void;
}

/**
 * BlackHoleWipe — Pure CSS @keyframes animation (no Framer Motion animate prop).
 *
 * Timeline (all via CSS animation-delay, immune to React Compiler):
 *   0.0s → Cards spring from center to circle positions (bh-card-appear)
 *   0.6s → Singularity starts growing (bh-singularity-grow)
 *   1.0s → Cards spiral from circle to center (bh-card-spiral), staggered
 *   2.2s → Singularity collapses (bh-singularity-collapse)
 *   2.6s → onComplete fires
 */
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

        // Stagger for spiral phase
        const spiralDelay = 1.0 + i * 0.08;

        return (
          <div
            key={product.id}
            className="absolute"
            style={{
              // CSS custom properties drive the keyframes
              "--cx": `${cx}px`,
              "--cy": `${cy}px`,
              // Phase 1: appear (0s to 0.5s), fill forwards so it holds position
              // Phase 2: spiral (starts at spiralDelay), fill forwards so it ends at center
              animation: `bh-card-appear 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.06}s both, bh-card-spiral 0.8s cubic-bezier(0.55, 0, 0.1, 1) ${spiralDelay}s forwards`,
            } as React.CSSProperties}
          >
            <div
              className="rounded-2xl bg-white border border-red-200 shadow-lg p-3 flex flex-col justify-between"
              style={{ width: 190, height: 110 }}
            >
              <p
                className="text-xs font-semibold line-clamp-2"
                style={{ color: "var(--foreground)" }}
              >
                {product.title}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-red-400">{product.domain}</span>
                <span className="text-sm font-bold text-red-500">
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

      {/* Singularity */}
      <div
        className="absolute rounded-full"
        style={{
          width: 96,
          height: 96,
          background: "radial-gradient(circle, #1A1A1A 0%, transparent 70%)",
          boxShadow:
            "0 0 60px 20px rgba(26,26,26,0.4), 0 0 120px 40px rgba(255,107,0,0.15)",
          // Grow from 0.6s to 1.1s, then collapse from 2.2s to 2.6s
          animation:
            "bh-singularity-grow 0.5s ease-out 0.6s both, bh-singularity-collapse 0.4s ease-in 2.2s forwards",
        }}
      />

      {/* Label */}
      <p
        className="absolute text-xs font-medium"
        style={{
          bottom: 16,
          color: "var(--text-subtle)",
          animation: "label-fade-in-out 2.0s ease 0.2s both",
        }}
      >
        Eliminating flagged results...
      </p>
    </div>
  );
}
