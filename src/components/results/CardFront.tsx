"use client";

import { Bookmark, ExternalLink, ShoppingBag } from "lucide-react";
import { TrustBadge } from "./TrustBadge";
import type { ProductWithVerdict } from "@/types";

const PIXEL_FONT = "'Press Start 2P', monospace";

interface CardFrontProps {
  product: ProductWithVerdict;
  showActions?: boolean;
  isTopPick?: boolean;
  isSaved?: boolean;
  onToggleSave?: () => void;
  onActionAreaEnter?: () => void;
}

export function CardFront({
  product,
  showActions = false,
  isTopPick = false,
  isSaved = false,
  onToggleSave,
  onActionAreaEnter,
}: CardFrontProps) {
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: product.currency || "USD",
  }).format(product.price);

  return (
    <div
      className="relative w-full h-full flex flex-col justify-between p-4"
      style={{
        border: `4px solid ${isTopPick ? "#FFD700" : "#1A1A1A"}`,
        borderRadius: 0,
        background: "#FFF8E8",
        boxShadow: isTopPick
          ? undefined
          : "4px 4px 0 #1A1A1A",
        imageRendering: "pixelated",
        animation: isTopPick ? "pixel-glow-pulse 3s ease-in-out infinite" : undefined,
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

      {/* Top section */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Badge row */}
        <div className="flex items-start justify-between mb-2">
          {isTopPick && (
            <div className="flex items-center gap-1" style={{ fontFamily: PIXEL_FONT, fontSize: 6, color: "#FFD700" }}>
              {/* Pixel trophy */}
              <svg width="12" height="12" viewBox="0 0 8 8" style={{ imageRendering: "pixelated" }}>
                <rect x="1" y="0" width="6" height="1" fill="#FFD700" />
                <rect x="0" y="1" width="8" height="1" fill="#FFD700" />
                <rect x="0" y="2" width="8" height="1" fill="#FFD700" />
                <rect x="1" y="3" width="6" height="1" fill="#FFD700" />
                <rect x="2" y="4" width="4" height="1" fill="#FFD700" />
                <rect x="3" y="5" width="2" height="1" fill="#8B6914" />
                <rect x="2" y="6" width="4" height="1" fill="#8B6914" />
              </svg>
              <span>TOP LOOT</span>
            </div>
          )}
          <div className={isTopPick ? "" : "ml-auto"}>
            <TrustBadge verdict={product.verdict} score={product.trustScore} />
          </div>
        </div>

        {/* Product image or placeholder */}
        <div
          className="w-full mb-2 overflow-hidden flex items-center justify-center"
          style={{
            height: 90,
            border: "2px solid #1A1A1A",
            background: "#F5E6C8",
          }}
        >
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.title}
              className="w-full h-full object-contain"
              style={{ imageRendering: "auto" }}
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
          style={{ fontFamily: PIXEL_FONT, fontSize: 7, lineHeight: 1.8, color: "#1A1A1A" }}
        >
          {product.title}
        </h3>

        {/* Retailer */}
        <p className="mb-1" style={{ fontFamily: PIXEL_FONT, fontSize: 6, color: "#8B6914" }}>
          {product.domain}
        </p>

        {/* Rating — pixel stars */}
        {product.rating != null && (
          <div className="flex items-center gap-1 mb-1">
            <span style={{ fontFamily: PIXEL_FONT, fontSize: 6, color: "#FFD700" }}>
              {"★".repeat(Math.round(product.rating))}
              {"☆".repeat(5 - Math.round(product.rating))}
            </span>
            {product.reviewCount != null && (
              <span style={{ fontFamily: PIXEL_FONT, fontSize: 5, color: "#8B6914" }}>
                ({product.reviewCount.toLocaleString()})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom section */}
      <div style={{ position: "relative", zIndex: 1 }} onMouseEnter={showActions ? onActionAreaEnter : undefined}>
        {/* Price — gold coin style */}
        <p className="mb-2" style={{ fontFamily: PIXEL_FONT, fontSize: 14, color: "#FFD700", textShadow: "2px 2px 0 #8B6914" }}>
          {formattedPrice}
        </p>

        {/* Action buttons */}
        {showActions && (
          <div className="flex gap-2">
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="pixel-btn flex-1 flex items-center justify-center gap-1.5 py-2"
              style={{
                border: "3px solid #1A1A1A",
                background: "#FF6B00",
                fontFamily: PIXEL_FONT,
                fontSize: 6,
                color: "#FFF8E8",
                cursor: "pointer",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={10} />
              VISIT
            </a>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave?.();
              }}
              className="pixel-btn flex items-center justify-center w-10"
              style={{
                border: "3px solid #1A1A1A",
                background: isSaved ? "#FFD700" : "#FFF8E8",
                cursor: "pointer",
                color: isSaved ? "#1A1A1A" : "#8B6914",
              }}
            >
              <Bookmark size={12} fill={isSaved ? "currentColor" : "none"} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
