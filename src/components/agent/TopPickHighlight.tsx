"use client";

import { motion } from "framer-motion";
import { Trophy, ExternalLink, Bookmark } from "lucide-react";
import { useAgentStore } from "@/stores/agentStore";
import FraudBadge from "./FraudBadge";
import ResultCard from "./ResultCard";

export default function TopPickHighlight() {
  const topPick = useAgentStore((s) => s.topPick());
  const goodResults = useAgentStore((s) => s.goodResults());
  const savePick = useAgentStore((s) => s.savePick);
  const others = goodResults.filter((r) => r.id !== topPick?.id);

  if (!topPick) return null;

  return (
    <div className="flex flex-col items-center px-6 py-8 max-w-4xl mx-auto">
      {/* Best Deal Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
        className="flex items-center gap-2 px-4 py-2 bg-orange-100 rounded-full mb-6"
      >
        <Trophy className="w-4 h-4 text-orange-500" />
        <span className="text-sm font-bold text-orange-600">
          Best Deal Found!
        </span>
      </motion.div>

      {/* Hero Card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
        className="w-full max-w-lg"
        style={{ animation: "glow-pulse 3s ease-in-out infinite" }}
      >
        <div className="bg-white rounded-3xl shadow-xl border-2 border-orange-300 p-6 relative overflow-hidden">
          {/* Subtle gradient bg */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-white pointer-events-none" />

          <div className="relative">
            {/* Product Info */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-800">
                  {topPick.product.name}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {topPick.product.retailer}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-orange-500">
                  ${topPick.product.price.toFixed(2)}
                </p>
                <span className="text-xs text-emerald font-semibold">
                  Best Price
                </span>
              </div>
            </div>

            {/* Fraud Markers */}
            {topPick.fraud.markers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {topPick.fraud.markers.map((m, i) => (
                  <FraudBadge key={i} marker={m} />
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => savePick(topPick)}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full transition-colors"
              >
                <Bookmark className="w-4 h-4" />
                Save This Deal
              </button>
              {topPick.product.url && (
                <a
                  href={topPick.product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-5 py-3 bg-white border-2 border-orange-200 hover:border-orange-300 text-orange-600 font-semibold rounded-full transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Visit Store
                </a>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Other Results (horizontal strip) */}
      {others.length > 0 && (
        <div className="w-full mt-8">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-3 text-center">
            Other options
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2 px-4">
            {others.map((result) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0.5, scale: 0.95 }}
                animate={{ opacity: 0.7, scale: 0.95 }}
                className="flex-shrink-0 w-56"
              >
                <ResultCard result={result} variant="good" compact />
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
