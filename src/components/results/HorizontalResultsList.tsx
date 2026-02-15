"use client";

import { motion } from "framer-motion";
import { FlipCard } from "./FlipCard";
import { useResultsStore } from "@/stores/resultsStore";
import type { ProductWithVerdict } from "@/types";

const PIXEL_FONT = "'Press Start 2P', monospace";

interface HorizontalResultsListProps {
  products: ProductWithVerdict[];
  bestPickId: string | null;
  onContinue?: () => void;
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
  onContinue,
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
        className="results-scroll flex gap-5 overflow-x-auto overflow-y-clip snap-x snap-mandatory px-1 py-2"
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
            style={{ width: 280, height: 500 }}
          >
            <FlipCard
              product={product}
              showActions
              isTopPick={product.id === topPickId}
              isSaved={savedItems.includes(product.id)}
              onToggleSave={() => toggleSave(product.id)}
              className="w-[280px] h-[500px]"
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Continue button */}
      {onContinue && (
        <motion.div
          className="flex justify-center mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: sorted.length * 0.08 + 0.5, duration: 0.4, ease: "easeOut" }}
        >
          <button
            onClick={onContinue}
            className="pixel-btn flex items-center gap-2 px-10 py-3 cursor-pointer"
            style={{
              border: "4px solid #1A1A1A",
              background: "#FF6B00",
              fontFamily: PIXEL_FONT,
              fontSize: 10,
              color: "#FFF8E8",
              boxShadow: "4px 4px 0 #1A1A1A",
            }}
          >
            CONTINUE
            {/* Pixel arrow */}
            <svg width="12" height="12" viewBox="0 0 8 8" style={{ imageRendering: "pixelated" }}>
              <rect x="1" y="3" width="4" height="2" fill="#FFF8E8" />
              <rect x="4" y="2" width="1" height="4" fill="#FFF8E8" />
              <rect x="5" y="3" width="1" height="2" fill="#FFF8E8" />
              <rect x="6" y="3.5" width="1" height="1" fill="#FFF8E8" />
            </svg>
          </button>
        </motion.div>
      )}
    </div>
  );
}
