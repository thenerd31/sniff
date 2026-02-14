"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAgentStore } from "@/stores/agentStore";
import ResultCard from "./ResultCard";

export default function SortAnimation() {
  const goodResults = useAgentStore((s) => s.goodResults());
  const setPhase = useAgentStore((s) => s.setPhase);
  const [horizontal, setHorizontal] = useState(false);
  const [sorted, setSorted] = useState(false);

  const displayResults = sorted
    ? [...goodResults].sort((a, b) => a.product.price - b.product.price)
    : goodResults;

  useEffect(() => {
    const t1 = setTimeout(() => setHorizontal(true), 600);
    const t2 = setTimeout(() => setSorted(true), 1500);
    const t3 = setTimeout(() => setPhase("picked"), 2800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [setPhase]);

  return (
    <div className="flex flex-col items-center px-6 py-8 max-w-5xl mx-auto">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-sm font-medium text-orange-500 mb-6"
      >
        {!horizontal
          ? "Preparing results..."
          : !sorted
            ? "Sorting by price..."
            : "Finding your best deal..."}
      </motion.p>

      <motion.div
        layout
        className={`w-full ${
          horizontal
            ? "flex flex-row gap-4 overflow-x-auto pb-4 px-4"
            : "flex flex-col gap-3 max-w-md mx-auto"
        }`}
        transition={{ type: "spring", stiffness: 150, damping: 20 }}
      >
        <AnimatePresence>
          {displayResults.map((result, i) => (
            <motion.div
              key={result.id}
              layout
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 22,
                delay: sorted ? i * 0.08 : 0,
              }}
              className={horizontal ? "flex-shrink-0 w-64" : ""}
            >
              <ResultCard result={result} variant="good" compact={horizontal} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
