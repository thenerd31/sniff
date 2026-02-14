"use client";

import { motion } from "framer-motion";
import { Check, RotateCcw, ExternalLink } from "lucide-react";
import { useAgentStore } from "@/stores/agentStore";

// Confetti particles
const confettiColors = ["#FF6B35", "#FF8C42", "#FFA54C", "#34D399", "#FBBF24", "#F472B6"];

function Confetti() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-50">
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: confettiColors[i % confettiColors.length],
            left: `${10 + Math.random() * 80}%`,
            top: -10,
          }}
          initial={{ y: -10, rotate: 0, opacity: 1 }}
          animate={{
            y: window?.innerHeight ?? 800,
            rotate: 360 + Math.random() * 360,
            opacity: 0,
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            delay: Math.random() * 0.5,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

export default function SaveConfirmation() {
  const savedPick = useAgentStore((s) => s.savedPick);
  const reset = useAgentStore((s) => s.reset);

  if (!savedPick) return null;

  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 max-w-lg mx-auto">
      <Confetti />

      {/* Checkmark Animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.2 }}
        className="w-20 h-20 rounded-full bg-emerald flex items-center justify-center mb-6 shadow-lg shadow-emerald/30"
      >
        <motion.div
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <Check className="w-10 h-10 text-white" strokeWidth={3} />
        </motion.div>
      </motion.div>

      {/* Message */}
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-2xl font-bold text-gray-800 mb-2"
      >
        Saved to your collection!
      </motion.h2>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-sm text-gray-500 mb-8"
      >
        You can find this deal in your saved items
      </motion.p>

      {/* Saved Item Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, type: "spring" }}
        className="w-full bg-white rounded-2xl shadow-md border border-orange-100 p-5 mb-8"
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">{savedPick.product.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{savedPick.product.retailer}</p>
          </div>
          <p className="text-xl font-bold text-orange-500">
            ${savedPick.product.price.toFixed(2)}
          </p>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="flex gap-3"
      >
        <button
          onClick={reset}
          className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Search Again
        </button>
        {savedPick.product.url && (
          <a
            href={savedPick.product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-orange-200 hover:border-orange-300 text-orange-600 font-semibold rounded-full transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Visit Store
          </a>
        )}
      </motion.div>
    </div>
  );
}
