"use client";

import { useState, useCallback } from "react";
import { ItemReport } from "./ItemReport";
import type { SavedProductSnapshot } from "@/types/dashboard";

interface SavedItemCardProps {
  snapshot: SavedProductSnapshot;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onRemove: () => void;
}

const PIXEL_FONT = "'Press Start 2P', monospace";

function getVerdictClass(verdict: string): string {
  switch (verdict) {
    case "trusted":
      return "verdict-trusted";
    case "caution":
      return "verdict-caution";
    case "danger":
      return "verdict-danger";
    default:
      return "";
  }
}

function getScoreColor(verdict: string): string {
  switch (verdict) {
    case "trusted":
      return "#00CC00";
    case "caution":
      return "#FFD700";
    case "danger":
      return "#FF4444";
    default:
      return "#8B6914";
  }
}

export function SavedItemCard({
  snapshot,
  index,
  isExpanded,
  onToggleExpand,
  onRemove,
}: SavedItemCardProps) {
  const [removing, setRemoving] = useState(false);
  const { product } = snapshot;

  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: product.currency || "USD",
  }).format(product.price);

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setRemoving(true);
      setTimeout(() => onRemove(), 500);
    },
    [onRemove]
  );

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleExpand();
    },
    [onToggleExpand]
  );

  return (
    <div
      className={`dash-pixel-frame ${isExpanded ? "md:col-span-2" : ""}`}
      style={{
        animation: removing
          ? "card-remove 0.5s ease-in forwards"
          : `dashboard-card-enter 0.35s ease-out ${index * 0.08}s both`,
      }}
    >
      {/* ── Collapsed Summary ──────────────────────────────────────── */}
      <div className="p-8">
        {/* Title */}
        <h3
          className="mb-4"
          style={{
            fontFamily: PIXEL_FONT,
            fontSize: 11,
            color: "#1A1A1A",
            lineHeight: 2,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {product.title}
        </h3>

        {/* Price + Retailer row */}
        <div className="flex items-center justify-between mb-5">
          <span
            style={{
              fontFamily: PIXEL_FONT,
              fontSize: 16,
              color: "#FF6B00",
            }}
          >
            {formattedPrice}
          </span>
          <span
            style={{
              fontFamily: PIXEL_FONT,
              fontSize: 9,
              color: "#8B6914",
            }}
          >
            {product.retailer}
          </span>
        </div>

        {/* Verdict badge + Trust score */}
        <div className="flex items-center justify-between mb-6">
          <span
            className={`pixel-verdict-badge ${getVerdictClass(product.verdict)}`}
          >
            {product.verdict.toUpperCase()}
          </span>
          <div className="flex items-center gap-3">
            <span
              style={{
                fontFamily: PIXEL_FONT,
                fontSize: 9,
                color: "#6B7280",
              }}
            >
              SCORE:
            </span>
            <span
              style={{
                fontFamily: PIXEL_FONT,
                fontSize: 14,
                color: getScoreColor(product.verdict),
                fontWeight: "bold",
              }}
            >
              {product.trustScore}
            </span>
          </div>
        </div>

        {/* Rating if available */}
        {product.rating && (
          <div className="flex items-center gap-3 mb-5">
            <span
              style={{
                fontFamily: PIXEL_FONT,
                fontSize: 9,
                color: "#8B6914",
              }}
            >
              ★ {product.rating.toFixed(1)}
            </span>
            {product.reviewCount && (
              <span
                style={{
                  fontFamily: PIXEL_FONT,
                  fontSize: 8,
                  color: "#6B7280",
                }}
              >
                ({product.reviewCount.toLocaleString()} reviews)
              </span>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleToggle}
            className="dashboard-pixel-btn flex-1 px-4 py-4 text-center"
            style={{
              fontFamily: PIXEL_FONT,
              fontSize: 9,
              color: "#1A1A1A",
              fontWeight: "bold",
            }}
          >
            {isExpanded ? "HIDE REPORT" : "VIEW REPORT"}
          </button>
          <button
            onClick={handleRemove}
            className="dashboard-pixel-btn danger-btn px-4 py-4 text-center"
            style={{
              fontFamily: PIXEL_FONT,
              fontSize: 9,
              fontWeight: "bold",
            }}
          >
            REMOVE
          </button>
        </div>
      </div>

      {/* ── Expanded Report ────────────────────────────────────────── */}
      {isExpanded && (
        <div
          className="px-8 pb-8"
          style={{ borderTop: "3px solid #1A1A1A" }}
        >
          <div className="pt-8">
            <ItemReport product={product} savedAt={snapshot.savedAt} />
          </div>
        </div>
      )}
    </div>
  );
}
