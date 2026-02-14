"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { FlipCard } from "./FlipCard";
import { useResultsStore } from "@/stores/resultsStore";
import type { ProductWithVerdict } from "@/types";

interface HorizontalResultsListProps {
  products: ProductWithVerdict[];
  bestPickId: string | null;
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 250, damping: 22 },
  },
};

export function HorizontalResultsList({
  products,
  bestPickId,
}: HorizontalResultsListProps) {
  const { savedItems, toggleSave } = useResultsStore();

  // Sort by price ascending
  const sorted = [...products].sort((a, b) => a.price - b.price);

  // If no explicit bestPick, cheapest trusted is the best pick
  const topPickId = bestPickId || sorted[0]?.id;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Trophy size={22} className="text-[var(--brand)]" />
        <h2 className="text-xl font-bold text-[var(--foreground)]">
          Your Best Deals
        </h2>
        <span className="text-sm text-[var(--text-subtle)]">
          Sorted by price · {sorted.length} results
        </span>
      </div>

      {/* Horizontal scrollable list */}
      <motion.div
        className="results-scroll flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4 px-1"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {sorted.map((product) => (
          <motion.div
            key={product.id}
            variants={cardVariants}
            layoutId={`card-${product.id}`}
            className="snap-start shrink-0"
          >
            <FlipCard
              product={product}
              showActions
              isTopPick={product.id === topPickId}
              isSaved={savedItems.includes(product.id)}
              onToggleSave={() => toggleSave(product.id)}
              className="w-[280px] h-[380px]"
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
