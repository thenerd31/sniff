"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FlipCard } from "./FlipCard";
import { useResultsStore } from "@/stores/resultsStore";
import type { ProductWithVerdict } from "@/types";

interface ShuffleSortProps {
  products: ProductWithVerdict[];
  onComplete: () => void;
}

type ShufflePhase = "scatter" | "label" | "consolidate";

export function ShuffleSort({ products, onComplete }: ShuffleSortProps) {
  const [shufflePhase, setShufflePhase] = useState<ShufflePhase>("scatter");
  const [randomPositions] = useState(() =>
    products.map(() => ({
      x: (Math.random() - 0.5) * 600,
      y: (Math.random() - 0.5) * 400,
      rotate: (Math.random() - 0.5) * 60,
    }))
  );
  const { savedItems, toggleSave } = useResultsStore();
  const hasStarted = useRef(false);

  // sorted by price ascending
  const sortedProducts = [...products].sort((a, b) => a.price - b.price);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    // Phase 1: scatter (0 → 0.8s)
    const scatterTimer = setTimeout(() => {
      setShufflePhase("label");
    }, 800);

    // Phase 2: label (0.8 → 1.3s)
    const labelTimer = setTimeout(() => {
      setShufflePhase("consolidate");
    }, 1300);

    // Phase 3: consolidate (1.3 → 2.8s) then complete
    const doneTimer = setTimeout(() => {
      onComplete();
    }, 2800);

    return () => {
      clearTimeout(scatterTimer);
      clearTimeout(labelTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <div className="relative w-full min-h-[500px]">
      {/* Sorting label */}
      <AnimatePresence>
        {shufflePhase === "label" && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-lg font-semibold text-[var(--foreground)] bg-white/90 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-lg">
              Sorting by price...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cards container */}
      <div
        className={`
          relative w-full transition-all duration-500
          ${shufflePhase === "consolidate" ? "flex flex-row gap-6 overflow-x-auto px-4 py-8" : ""}
        `}
        style={shufflePhase !== "consolidate" ? { height: 500 } : undefined}
      >
        {(shufflePhase === "consolidate" ? sortedProducts : products).map((product, i) => {
          const isScatter = shufflePhase === "scatter" || shufflePhase === "label";

          return (
            <motion.div
              key={product.id}
              layoutId={`shuffle-card-${product.id}`}
              className={shufflePhase === "consolidate" ? "shrink-0" : "absolute"}
              style={
                isScatter
                  ? { left: "50%", top: "50%" }
                  : undefined
              }
              initial={
                isScatter
                  ? {
                      x: randomPositions[i]?.x || 0,
                      y: randomPositions[i]?.y || 0,
                      rotate: randomPositions[i]?.rotate || 0,
                      scale: 0.85,
                    }
                  : undefined
              }
              animate={
                isScatter
                  ? {
                      x: randomPositions[i]?.x || 0,
                      y: randomPositions[i]?.y || 0,
                      rotate: randomPositions[i]?.rotate || 0,
                      scale: 0.85,
                    }
                  : {
                      x: 0,
                      y: 0,
                      rotate: 0,
                      scale: 1,
                    }
              }
              transition={
                isScatter
                  ? { type: "spring", stiffness: 150, damping: 15 }
                  : { type: "spring", stiffness: 200, damping: 22, delay: i * 0.08 }
              }
            >
              <FlipCard
                product={product}
                isSaved={savedItems.includes(product.id)}
                onToggleSave={() => toggleSave(product.id)}
                className="w-[240px] h-[320px]"
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
