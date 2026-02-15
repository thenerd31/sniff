"use client";

import { motion } from "framer-motion";
import { FlipCard } from "./FlipCard";
import { useResultsStore } from "@/stores/resultsStore";
import type { ProductWithVerdict } from "@/types";

const PIXEL_FONT = "'Press Start 2P', monospace";

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
  const savedItems = useResultsStore((s) => s.savedItems);
  const toggleSave = useResultsStore((s) => s.toggleSave);

  const sorted = [...products].sort((a, b) => a.price - b.price);
  const topPickId = bestPickId || sorted[0]?.id;

  return (
    <div className="w-full">
      {/* Header — pixel style */}
      <div className="flex items-center gap-3 mb-6">
        {/* Pixel trophy */}
        <svg width="20" height="20" viewBox="0 0 8 8" style={{ imageRendering: "pixelated" }}>
          <rect x="1" y="0" width="6" height="1" fill="#FFD700" />
          <rect x="0" y="1" width="8" height="1" fill="#FFD700" />
          <rect x="0" y="2" width="8" height="1" fill="#FFD700" />
          <rect x="1" y="3" width="6" height="1" fill="#FFD700" />
          <rect x="2" y="4" width="4" height="1" fill="#FFD700" />
          <rect x="3" y="5" width="2" height="1" fill="#8B6914" />
          <rect x="2" y="6" width="4" height="1" fill="#8B6914" />
        </svg>
        <h2 style={{ fontFamily: PIXEL_FONT, fontSize: 10, color: "#FFF8E8", textShadow: "2px 2px 0 #1A1A1A" }}>
          BEST DEALS
        </h2>
        <span
          style={{
            fontFamily: PIXEL_FONT,
            fontSize: 7,
            color: "#FFF8E8",
            background: "#8B6914",
            border: "2px solid #1A1A1A",
            padding: "2px 8px",
          }}
        >
          {sorted.length} ITEMS
        </span>
      </div>

      {/* Horizontal scrollable list */}
      <motion.div
        className="results-scroll flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4 px-1"
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
