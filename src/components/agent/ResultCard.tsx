"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Package } from "lucide-react";
import type { ShoppingResult } from "@/types";
import FraudBadge from "./FraudBadge";

interface ResultCardProps {
  result: ShoppingResult;
  variant: "good" | "bad";
  compact?: boolean;
}

function ResultCard({ result, variant, compact }: ResultCardProps) {
  const borderColor =
    variant === "good" ? "border-l-emerald" : "border-l-red";
  const bgHover =
    variant === "good" ? "hover:shadow-emerald/10" : "hover:shadow-red/10";

  return (
    <motion.div
      layout
      className={`bg-white rounded-2xl shadow-md ${bgHover} hover:shadow-lg transition-shadow border border-gray-100 border-l-4 ${borderColor} overflow-hidden ${compact ? "p-3" : "p-4"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3
            className={`font-semibold text-gray-800 truncate ${compact ? "text-sm" : "text-base"}`}
          >
            {result.product.name}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {result.product.retailer}
          </p>
        </div>
        <div className="flex-shrink-0 text-right">
          <p
            className={`font-bold text-orange-500 ${compact ? "text-lg" : "text-xl"}`}
          >
            ${result.product.price.toFixed(2)}
          </p>
          {result.product.inStock ? (
            <span className="text-[10px] text-emerald font-medium">
              In Stock
            </span>
          ) : (
            <span className="text-[10px] text-red font-medium">
              Out of Stock
            </span>
          )}
        </div>
      </div>

      {/* Fraud Markers */}
      {!compact && result.fraud.markers.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {result.fraud.markers.map((m, i) => (
            <FraudBadge key={i} marker={m} />
          ))}
        </div>
      )}

      {/* Link */}
      {!compact && result.product.url && (
        <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2">
          <Package className="w-3 h-3 text-gray-400" />
          <a
            href={result.product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-1 truncate"
          >
            View on {result.product.retailer}
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </motion.div>
  );
}

export default memo(ResultCard);
