"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CardFront } from "./CardFront";
import { CardBack } from "./CardBack";
import type { ProductWithVerdict } from "@/types";

interface FlipCardProps {
  product: ProductWithVerdict;
  showActions?: boolean;
  isTopPick?: boolean;
  isSaved?: boolean;
  onToggleSave?: () => void;
  className?: string;
}

export function FlipCard({
  product,
  showActions = false,
  isTopPick = false,
  isSaved = false,
  onToggleSave,
  className = "",
}: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className={`relative ${className}`}
      style={{ perspective: 1000 }}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 18 }}
      >
        {/* Front face */}
        <div
          className="absolute inset-0"
          style={{ backfaceVisibility: "hidden" }}
        >
          <CardFront
            product={product}
            showActions={showActions}
            isTopPick={isTopPick}
            isSaved={isSaved}
            onToggleSave={onToggleSave}
          />
        </div>

        {/* Back face */}
        <div
          className="absolute inset-0"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <CardBack product={product} />
        </div>
      </motion.div>
    </div>
  );
}
