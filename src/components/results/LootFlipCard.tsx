"use client";

import { useState } from "react";
import { CardBack } from "./CardBack";
import { Bookmark, ShoppingBag } from "lucide-react";
import { TrustBadge } from "./TrustBadge";
import type { ProductWithVerdict } from "@/types";

const PIXEL_FONT = "'Press Start 2P', monospace";

interface LootFlipCardProps {
  product: ProductWithVerdict;
  isSaved?: boolean;
  onToggleSave?: () => void;
  className?: string;
}

/**
 * Compact flip card for the "LOOT FOUND" two-column layout.
 * Hover flips to scan log (CardBack). No scale, no action buttons.
 */
export function LootFlipCard({
  product,
  isSaved = false,
  onToggleSave,
  className = "",
}: LootFlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: product.currency || "USD",
  }).format(product.price);

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
          transform: isFlipped ? "rotateY(180deg)" : "none",
        }}
      >
        {/* Front face — compact product card */}
        <div className="absolute inset-0 backface-hidden">
          <div
            className="relative w-full h-full flex flex-col p-3"
            style={{
              border: "4px solid #1A1A1A",
              background: "#FFF8E8",
              boxShadow: "4px 4px 0 #1A1A1A",
              imageRendering: "pixelated",
            }}
          >
            {/* Inner border */}
            <div
              style={{
                position: "absolute",
                inset: 3,
                border: "2px solid #1A1A1A20",
                pointerEvents: "none",
              }}
            />

            {/* Badge row */}
            <div className="flex items-start justify-between mb-2" style={{ position: "relative", zIndex: 1 }}>
              <TrustBadge verdict={product.verdict} score={product.trustScore} />
              {onToggleSave && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSave();
                  }}
                  className="pixel-btn flex items-center justify-center"
                  style={{
                    width: 24,
                    height: 24,
                    border: "2px solid #1A1A1A",
                    background: isSaved ? "#FFD700" : "#FFF8E8",
                    cursor: "pointer",
                    color: isSaved ? "#1A1A1A" : "#8B6914",
                  }}
                >
                  <Bookmark size={10} fill={isSaved ? "currentColor" : "none"} />
                </button>
              )}
            </div>

            {/* Product image */}
            <div
              className="w-full mb-2 flex items-center justify-center p-2"
              style={{
                height: 200,
                border: "2px solid #1A1A1A",
                background: "#FDF6E3",
                imageRendering: "pixelated",
                position: "relative",
                zIndex: 1,
              }}
            >
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  className="max-w-full max-h-full object-contain"
                  style={{ imageRendering: "crisp-edges" }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <ShoppingBag size={24} style={{ color: "#8B6914", opacity: 0.5 }} />
              )}
            </div>

            {/* Title */}
            <h3
              className="line-clamp-2 mb-1"
              style={{ fontFamily: PIXEL_FONT, fontSize: 9, lineHeight: 1.8, color: "#1A1A1A", position: "relative", zIndex: 1 }}
            >
              {product.title}
            </h3>

            {/* Domain */}
            <p className="mb-1" style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: "#8B6914", position: "relative", zIndex: 1 }}>
              {product.domain}
            </p>

            {/* Price + rating row */}
            <div className="mt-auto pt-2 flex items-center justify-between" style={{ position: "relative", zIndex: 1 }}>
              <p style={{ fontFamily: PIXEL_FONT, fontSize: 12, color: "#FFD700", textShadow: "2px 2px 0 #8B6914" }}>
                {formattedPrice}
              </p>
              {product.rating != null && (
                <span style={{ fontFamily: PIXEL_FONT, fontSize: 5, color: "#FFD700" }}>
                  {"★".repeat(Math.round(product.rating))}
                  {"☆".repeat(5 - Math.round(product.rating))}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Back face */}
        <div className="absolute inset-0 backface-hidden rotate-y-180">
          <CardBack product={product} />
        </div>
      </div>
    </div>
  );
}
