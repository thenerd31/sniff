"use client";

import { Bookmark, ExternalLink, Trophy } from "lucide-react";
import { TrustBadge } from "./TrustBadge";
import type { ProductWithVerdict } from "@/types";

interface CardFrontProps {
  product: ProductWithVerdict;
  showActions?: boolean;
  isTopPick?: boolean;
  isSaved?: boolean;
  onToggleSave?: () => void;
}

export function CardFront({
  product,
  showActions = false,
  isTopPick = false,
  isSaved = false,
  onToggleSave,
}: CardFrontProps) {
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: product.currency || "USD",
  }).format(product.price);

  return (
    <div
      className={`
        relative w-full h-full rounded-3xl p-5 flex flex-col justify-between
        bg-white border border-[var(--border)]
        shadow-[0_2px_20px_rgba(0,0,0,0.05)]
        ${isTopPick ? "ring-2 ring-[var(--brand)] ring-opacity-40" : ""}
      `}
      style={isTopPick ? { animation: "glow-pulse 3s ease-in-out infinite" } : undefined}
    >
      {/* Top section */}
      <div>
        {/* Badge row */}
        <div className="flex items-start justify-between mb-3">
          {isTopPick && (
            <div className="flex items-center gap-1 text-[var(--brand)] text-xs font-bold">
              <Trophy size={14} />
              <span>Best Deal</span>
            </div>
          )}
          <div className={isTopPick ? "" : "ml-auto"}>
            <TrustBadge verdict={product.verdict} score={product.trustScore} />
          </div>
        </div>

        {/* Product image placeholder */}
        {product.imageUrl && (
          <div className="w-full h-28 rounded-2xl bg-[var(--surface)] mb-3 overflow-hidden">
            <img
              src={product.imageUrl}
              alt={product.title}
              className="w-full h-full object-contain"
            />
          </div>
        )}

        {/* Title */}
        <h3 className="text-sm font-semibold text-[var(--foreground)] line-clamp-2 leading-tight mb-1">
          {product.title}
        </h3>

        {/* Retailer */}
        <p className="text-xs font-mono text-[var(--text-subtle)] mb-2">
          {product.domain}
        </p>

        {/* Rating */}
        {product.rating && (
          <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] mb-2">
            <span className="text-amber-400">★</span>
            <span>{product.rating.toFixed(1)}</span>
            {product.reviewCount && (
              <span className="text-[var(--text-subtle)]">
                ({product.reviewCount.toLocaleString()})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom section */}
      <div>
        {/* Price */}
        <p className="text-2xl font-bold text-[var(--brand)] mb-3">
          {formattedPrice}
        </p>

        {/* Action buttons (shown in final list phase) */}
        {showActions && (
          <div className="flex gap-2">
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="
                flex-1 flex items-center justify-center gap-1.5
                bg-[var(--brand)] text-white text-xs font-semibold
                py-2.5 rounded-2xl
                shadow-[0_2px_8px_rgba(255,107,0,0.3)]
                hover:shadow-[0_4px_12px_rgba(255,107,0,0.4)]
                transition-shadow
              "
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={13} />
              Visit Site
            </a>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave?.();
              }}
              className={`
                flex items-center justify-center w-10 rounded-2xl border transition-colors
                ${
                  isSaved
                    ? "bg-[var(--brand-light)] border-[var(--brand)] text-[var(--brand)]"
                    : "bg-white border-[var(--border)] text-[var(--text-subtle)] hover:text-[var(--brand)] hover:border-[var(--brand)]"
                }
              `}
            >
              <Bookmark size={14} fill={isSaved ? "currentColor" : "none"} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
