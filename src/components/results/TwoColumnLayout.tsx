"use client";

import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert, Sparkles } from "lucide-react";
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
  const savedItems = useResultsStore((s) => s.savedItems);
  const toggleSave = useResultsStore((s) => s.toggleSave);
  const maxCol = Math.max(trusted.length, flagged.length);

  return (
    <div className="w-full">
      {/* Section header */}
      <motion.div
        className="text-center mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2
          className="text-2xl font-bold mb-2"
          style={{ color: "var(--foreground)" }}
        >
          We found {trusted.length + flagged.length} results
        </h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Hover any card to see the fraud analysis · {flagged.length} flagged as suspicious
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8 mb-10">
        {/* Trusted Column */}
        <div>
          <div className="flex items-center gap-2 mb-5">
            <ShieldCheck size={20} className="text-emerald-500" />
            <h3 className="text-lg font-bold text-[var(--foreground)]">
              Trusted Results
            </h3>
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
            {trusted.map((product) => (
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
            <h3 className="text-lg font-bold text-[var(--foreground)]">
              Flagged Results
            </h3>
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
            {flagged.map((product) => (
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

      {/* Seamless eliminate CTA — the one user action in the flow */}
      {flagged.length > 0 && (
        <motion.div
          className="flex flex-col items-center gap-3 py-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: maxCol * 0.1 + 0.3, duration: 0.5 }}
        >
          <p className="text-sm text-[var(--text-muted)]">
            Ready to remove the {flagged.length} suspicious results?
          </p>
          <button
            onClick={onEliminateFlagged}
            className="
              group relative flex items-center gap-2.5 px-8 py-4
              text-white text-sm font-semibold
              rounded-2xl overflow-hidden
              shadow-[0_4px_20px_rgba(255,107,0,0.3)]
              hover:shadow-[0_8px_32px_rgba(255,107,0,0.45)]
              hover:scale-[1.03]
              active:scale-[0.97]
              transition-all duration-200 ease-out
              cursor-pointer
            "
            style={{ background: "var(--brand)" }}
          >
            <Sparkles size={16} className="opacity-80" />
            Clean Up Results
            <motion.div
              className="absolute inset-0 bg-white/10"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            />
          </button>
        </motion.div>
      )}
    </div>
  );
}
