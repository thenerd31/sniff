"use client";

import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { FlipCard } from "./FlipCard";
import { useResultsStore } from "@/stores/resultsStore";
import type { ProductWithVerdict } from "@/types";

interface TwoColumnLayoutProps {
  trusted: ProductWithVerdict[];
  flagged: ProductWithVerdict[];
  onEliminateFlagged: () => void;
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
};

export function TwoColumnLayout({
  trusted,
  flagged,
  onEliminateFlagged,
}: TwoColumnLayoutProps) {
  const { savedItems, toggleSave } = useResultsStore();

  return (
    <div className="w-full">
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Trusted Column */}
        <div>
          <div className="flex items-center gap-2 mb-5">
            <ShieldCheck size={20} className="text-emerald-500" />
            <h2 className="text-lg font-bold text-[var(--foreground)]">Trusted Results</h2>
            <span className="ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              {trusted.length}
            </span>
          </div>
          <motion.div
            className="flex flex-col gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {trusted.map((product, i) => (
              <motion.div
                key={product.id}
                variants={cardVariants}
                layoutId={`card-${product.id}`}
              >
                <FlipCard
                  product={product}
                  isSaved={savedItems.includes(product.id)}
                  onToggleSave={() => toggleSave(product.id)}
                  className="h-[340px]"
                />
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Flagged Column */}
        <div>
          <div className="flex items-center gap-2 mb-5">
            <ShieldAlert size={20} className="text-red-400" />
            <h2 className="text-lg font-bold text-[var(--foreground)]">Flagged Results</h2>
            <span className="ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
              {flagged.length}
            </span>
          </div>
          <motion.div
            className="flex flex-col gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {flagged.map((product, i) => (
              <motion.div
                key={product.id}
                variants={cardVariants}
                layoutId={`card-${product.id}`}
              >
                <FlipCard
                  product={product}
                  isSaved={savedItems.includes(product.id)}
                  onToggleSave={() => toggleSave(product.id)}
                  className="h-[340px]"
                />
              </motion.div>
            ))}
            {flagged.length === 0 && (
              <p className="text-sm text-[var(--text-subtle)] text-center py-8">
                No flagged results — all clear!
              </p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Eliminate button */}
      {flagged.length > 0 && (
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <button
            onClick={onEliminateFlagged}
            className="
              group flex items-center gap-2 px-6 py-3
              bg-[var(--foreground)] text-white text-sm font-semibold
              rounded-2xl
              shadow-[0_4px_16px_rgba(26,26,26,0.2)]
              hover:shadow-[0_6px_24px_rgba(26,26,26,0.3)]
              hover:scale-[1.02]
              active:scale-[0.98]
              transition-all
            "
          >
            <span className="text-lg">🕳️</span>
            Eliminate Flagged Results
            <span className="text-xs opacity-60 ml-1">({flagged.length})</span>
          </button>
        </motion.div>
      )}
    </div>
  );
}
