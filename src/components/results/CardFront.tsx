"use client";

import { Bookmark, ExternalLink, Trophy, ShoppingBag } from "lucide-react";
import { TrustBadge } from "./TrustBadge";
import type { ProductWithVerdict } from "@/types";

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
      className={`
        relative w-full h-full rounded-3xl p-5 flex flex-col justify-between
        bg-white border
        shadow-[0_2px_20px_rgba(0,0,0,0.05)]
        ${isTopPick ? "border-[var(--brand)]" : "border-[var(--border)]"}
      `}
      style={isTopPick ? { animation: "glow-pulse 3s ease-in-out infinite" } : undefined}
    >
      {/* Top section */}
      <div>
        {/* Badge row */}
        <div className="flex items-start justify-between mb-3">
          {isTopPick && (
            <div className="flex items-center gap-1 text-xs font-bold" style={{ color: "var(--brand)" }}>
              <Trophy size={14} />
              <span>Best Deal</span>
            </div>
          )}
          <div className={isTopPick ? "" : "ml-auto"}>
            <TrustBadge verdict={product.verdict} score={product.trustScore} />
          </div>
        </div>

        {/* Product image or placeholder */}
        <div
          className="w-full rounded-2xl mb-3 overflow-hidden flex items-center justify-center"
          style={{ height: 100, background: "var(--surface)" }}
        >
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.title}
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
                (e.target as HTMLImageElement).parentElement!.innerHTML =
                  '<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:var(--text-subtle)"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg></div>';
              }}
            />
          ) : (
            <ShoppingBag size={28} style={{ color: "var(--text-subtle)", opacity: 0.4 }} />
          )}
        </div>

        {/* Title */}
        <h3
          className="text-sm font-semibold line-clamp-2 leading-tight mb-1"
          style={{ color: "var(--foreground)" }}
        >
          {product.title}
        </h3>

        {/* Retailer */}
        <p className="text-xs font-mono mb-1" style={{ color: "var(--text-subtle)" }}>
          {product.domain}
        </p>

        {/* Rating */}
        {product.rating != null && (
          <div className="flex items-center gap-1 text-xs mb-1" style={{ color: "var(--text-muted)" }}>
            <span className="text-amber-400">★</span>
            <span>{product.rating.toFixed(1)}</span>
            {product.reviewCount != null && (
              <span style={{ color: "var(--text-subtle)" }}>
                ({product.reviewCount.toLocaleString()})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom section — hovering here unflips the card so buttons stay clickable */}
      <div onMouseEnter={showActions ? onActionAreaEnter : undefined}>
        {/* Price */}
        <p className="text-2xl font-bold mb-3" style={{ color: "var(--brand)" }}>
          {formattedPrice}
        </p>

        {/* Action buttons (shown in final list phase) */}
        {showActions && (
          <div className="flex gap-2">
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 text-white text-xs font-semibold py-2.5 rounded-2xl transition-shadow"
              style={{
                background: "var(--brand)",
                boxShadow: "0 2px 8px rgba(255,107,0,0.3)",
              }}
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
              className="flex items-center justify-center w-10 rounded-2xl border transition-colors"
              style={{
                background: isSaved ? "var(--brand-light)" : "white",
                borderColor: isSaved ? "var(--brand)" : "var(--border)",
                color: isSaved ? "var(--brand)" : "var(--text-subtle)",
              }}
            >
              <Bookmark size={14} fill={isSaved ? "currentColor" : "none"} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
