"use client";

import { useState, useCallback } from "react";
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

  const handleActionAreaEnter = useCallback(() => {
    setIsFlipped(false);
  }, []);

  return (
    <div
      className={`perspective-1000 ${className}`}
      style={{ zIndex: isFlipped ? 20 : 1 }}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <div
        className="relative w-full h-full transform-style-3d"
        style={{
          transition: "transform 300ms ease-out",
          transform: isFlipped ? "rotateY(180deg) scale(1.1)" : "none",
        }}
      >
        {/* Front face */}
        <div className="absolute inset-0 backface-hidden">
          <CardFront
            product={product}
            showActions={showActions}
            isTopPick={isTopPick}
            isSaved={isSaved}
            onToggleSave={onToggleSave}
            onActionAreaEnter={handleActionAreaEnter}
          />
        </div>

        {/* Back face */}
        <div className="absolute inset-0 backface-hidden rotate-y-180">
          <CardBack product={product} />
        </div>
      </div>
    </div>
  );
}
