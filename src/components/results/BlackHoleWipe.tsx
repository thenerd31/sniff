"use client";

import { useEffect, useRef } from "react";
import { motion, useAnimate } from "framer-motion";
import type { ProductWithVerdict } from "@/types";

interface BlackHoleWipeProps {
  flaggedProducts: ProductWithVerdict[];
  onComplete: () => void;
}

export function BlackHoleWipe({ flaggedProducts, onComplete }: BlackHoleWipeProps) {
  const [scope, animate] = useAnimate();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const runAnimation = async () => {
      // Phase 1: Singularity scales in (0 → 0.3s)
      await animate(
        ".singularity",
        { scale: [0, 1], opacity: [0, 1] },
        { duration: 0.3, ease: "easeOut" }
      );

      // Phase 2: Cards spiral into center (0.3 → 1.8s)
      const cards = document.querySelectorAll(".wipe-card");
      const cardAnimations = Array.from(cards).map((card, i) =>
        animate(
          card,
          {
            x: 0,
            y: 0,
            scale: 0,
            rotate: 360,
            opacity: 0,
            filter: "blur(8px)",
          },
          {
            duration: 1.2,
            delay: i * 0.08,
            ease: [0.55, 0, 0.1, 1], // aggressive inward pull
          }
        )
      );

      await Promise.all(cardAnimations);

      // Phase 3: Singularity pulses then collapses (1.8 → 2.3s)
      await animate(
        ".singularity",
        { scale: [1, 1.3, 0], opacity: [1, 1, 0] },
        { duration: 0.5, ease: "easeInOut" }
      );

      // Done → advance to shuffling phase
      onComplete();
    };

    runAnimation();
  }, [animate, onComplete]);

  return (
    <div ref={scope} className="relative w-full min-h-[400px] flex items-center justify-center overflow-hidden">
      {/* Cards positioned around center */}
      {flaggedProducts.map((product, i) => {
        // Distribute cards in a circle around center
        const angle = (i / Math.max(flaggedProducts.length, 1)) * Math.PI * 2;
        const radius = 150;
        const startX = Math.cos(angle) * radius;
        const startY = Math.sin(angle) * radius;

        return (
          <motion.div
            key={product.id}
            className="wipe-card absolute"
            initial={{ x: startX, y: startY, scale: 1, rotate: 0, opacity: 1 }}
            style={{ filter: "blur(0px)" }}
          >
            <div className="w-[200px] h-[120px] rounded-2xl bg-white border border-red-200 shadow-lg p-3 flex flex-col justify-between">
              <p className="text-xs font-semibold text-[var(--foreground)] line-clamp-2">
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
          </motion.div>
        );
      })}

      {/* Singularity */}
      <motion.div
        className="singularity absolute w-24 h-24 rounded-full"
        initial={{ scale: 0, opacity: 0 }}
        style={{
          background: "radial-gradient(circle, #1A1A1A 0%, transparent 70%)",
          boxShadow:
            "0 0 60px 20px rgba(26,26,26,0.4), 0 0 120px 40px rgba(255,107,0,0.15)",
        }}
      />

      {/* Label */}
      <motion.p
        className="absolute bottom-4 text-xs text-[var(--text-subtle)] font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Eliminating flagged results...
      </motion.p>
    </div>
  );
}
