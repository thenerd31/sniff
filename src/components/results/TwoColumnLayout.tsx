"use client";

import { motion } from "framer-motion";
import { FlipCard } from "./FlipCard";
import { useResultsStore } from "@/stores/resultsStore";
import type { ProductWithVerdict } from "@/types";

const PIXEL_FONT = "'Press Start 2P', monospace";

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

/* Pixel heart for trusted column header */
function PixelHeartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 8 8" style={{ imageRendering: "pixelated" }}>
      <rect x="1" y="0" width="2" height="1" fill="#00CC00" />
      <rect x="5" y="0" width="2" height="1" fill="#00CC00" />
      <rect x="0" y="1" width="4" height="1" fill="#00CC00" />
      <rect x="4" y="1" width="4" height="1" fill="#00CC00" />
      <rect x="0" y="2" width="8" height="1" fill="#00CC00" />
      <rect x="0" y="3" width="8" height="1" fill="#00CC00" />
      <rect x="1" y="4" width="6" height="1" fill="#00CC00" />
      <rect x="2" y="5" width="4" height="1" fill="#00CC00" />
      <rect x="3" y="6" width="2" height="1" fill="#00CC00" />
    </svg>
  );
}

/* Pixel skull for flagged column header */
function PixelSkullIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 8 8" style={{ imageRendering: "pixelated" }}>
      <rect x="2" y="0" width="4" height="1" fill="#F5F5F5" />
      <rect x="1" y="1" width="6" height="1" fill="#F5F5F5" />
      <rect x="1" y="2" width="6" height="1" fill="#F5F5F5" />
      <rect x="1" y="3" width="2" height="1" fill="#FF0000" />
      <rect x="5" y="3" width="2" height="1" fill="#FF0000" />
      <rect x="3" y="3" width="2" height="1" fill="#F5F5F5" />
      <rect x="1" y="4" width="6" height="1" fill="#F5F5F5" />
      <rect x="3" y="4" width="2" height="1" fill="#1A1A1A" />
      <rect x="2" y="5" width="1" height="1" fill="#1A1A1A" />
      <rect x="3" y="5" width="2" height="1" fill="#F5F5F5" />
      <rect x="5" y="5" width="1" height="1" fill="#1A1A1A" />
      <rect x="2" y="6" width="4" height="1" fill="#F5F5F5" />
    </svg>
  );
}

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
      {/* Section header — pixel dialogue box */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2
          className="mb-2"
          style={{ fontFamily: PIXEL_FONT, fontSize: 12, color: "#FFF8E8", textShadow: "2px 2px 0 #1A1A1A" }}
        >
          LOOT FOUND: {trusted.length + flagged.length} ITEMS
        </h2>
        <p style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: "#D4C4A0" }}>
          Hover any card to scan for traps · {flagged.length} cursed items detected
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Trusted Column */}
        <div
          style={{
            border: "4px solid #006400",
            background: "#FFF8E8",
            boxShadow: "4px 4px 0 #1A1A1A, inset 0 0 0 3px #00640020",
            padding: 16,
          }}
        >
          <div className="flex items-center gap-2 mb-4 pb-2" style={{ borderBottom: "3px solid #006400" }}>
            <PixelHeartIcon />
            <h3 style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: "#006400" }}>
              SAFE LOOT
            </h3>
            {/* Score counter */}
            <span
              className="ml-auto"
              style={{
                fontFamily: PIXEL_FONT,
                fontSize: 10,
                color: "#FFF8E8",
                background: "#006400",
                border: "2px solid #1A1A1A",
                padding: "2px 8px",
              }}
            >
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
        <div
          style={{
            border: "4px solid #8B0000",
            background: "#FFF8E8",
            boxShadow: "4px 4px 0 #1A1A1A, inset 0 0 0 3px #8B000020",
            padding: 16,
          }}
        >
          <div className="flex items-center gap-2 mb-4 pb-2" style={{ borderBottom: "3px solid #8B0000" }}>
            <PixelSkullIcon />
            <h3 style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: "#8B0000" }}>
              CURSED ITEMS
            </h3>
            {/* Score counter */}
            <span
              className="ml-auto"
              style={{
                fontFamily: PIXEL_FONT,
                fontSize: 10,
                color: "#FFF8E8",
                background: "#8B0000",
                border: "2px solid #1A1A1A",
                padding: "2px 8px",
              }}
            >
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
              <p className="text-center py-8" style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: "#8B6914" }}>
                ALL CLEAR - NO TRAPS!
              </p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Eliminate CTA — pixel button */}
      {flagged.length > 0 && (
        <motion.div
          className="flex flex-col items-center gap-3 py-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: maxCol * 0.1 + 0.3, duration: 0.5 }}
        >
          <p style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: "#D4C4A0" }}>
            Destroy {flagged.length} cursed items?
          </p>
          <button
            onClick={onEliminateFlagged}
            className="pixel-btn flex items-center gap-2 px-8 py-3 cursor-pointer"
            style={{
              border: "4px solid #1A1A1A",
              background: "#FF6B00",
              fontFamily: PIXEL_FONT,
              fontSize: 8,
              color: "#FFF8E8",
              boxShadow: "4px 4px 0 #1A1A1A",
            }}
          >
            {/* Pixel sword icon */}
            <svg width="14" height="14" viewBox="0 0 8 8" style={{ imageRendering: "pixelated" }}>
              <rect x="6" y="0" width="1" height="1" fill="#C0C0C0" />
              <rect x="5" y="1" width="1" height="1" fill="#C0C0C0" />
              <rect x="4" y="2" width="1" height="1" fill="#C0C0C0" />
              <rect x="3" y="3" width="1" height="1" fill="#C0C0C0" />
              <rect x="2" y="4" width="1" height="1" fill="#8B6914" />
              <rect x="1" y="5" width="1" height="1" fill="#8B6914" />
              <rect x="0" y="6" width="1" height="1" fill="#8B6914" />
              <rect x="1" y="4" width="1" height="1" fill="#8B6914" />
              <rect x="3" y="4" width="1" height="1" fill="#8B6914" />
            </svg>
            PURGE CURSED
          </button>
        </motion.div>
      )}
    </div>
  );
}
