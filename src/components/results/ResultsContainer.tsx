"use client";

import { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useResultsStore } from "@/stores/resultsStore";
import { TwoColumnLayout } from "./TwoColumnLayout";
import { BlackHoleWipe } from "./BlackHoleWipe";
import { ShuffleSort } from "./ShuffleSort";
import { HorizontalResultsList } from "./HorizontalResultsList";

export function ResultsContainer() {
  const {
    phase,
    setPhase,
    getTrusted,
    getFlagged,
    getSortedTrusted,
    bestPickId,
  } = useResultsStore();

  const trusted = getTrusted();
  const flagged = getFlagged();
  const sortedTrusted = getSortedTrusted();

  const handleEliminateFlagged = useCallback(() => {
    setPhase("wiping");
  }, [setPhase]);

  const handleWipeComplete = useCallback(() => {
    setPhase("shuffling");
  }, [setPhase]);

  const handleShuffleComplete = useCallback(() => {
    setPhase("final-list");
  }, [setPhase]);

  if (phase === "hidden") return null;

  return (
    <motion.section
      className="w-full px-6 md:px-12 lg:px-20 py-10"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
    >
      <AnimatePresence mode="wait">
        {phase === "two-columns" && (
          <motion.div
            key="two-columns"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <TwoColumnLayout
              trusted={trusted}
              flagged={flagged}
              onEliminateFlagged={handleEliminateFlagged}
            />
          </motion.div>
        )}

        {phase === "wiping" && (
          <motion.div
            key="wiping"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <BlackHoleWipe
              flaggedProducts={flagged}
              onComplete={handleWipeComplete}
            />
          </motion.div>
        )}

        {phase === "shuffling" && (
          <motion.div
            key="shuffling"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <ShuffleSort
              products={trusted}
              onComplete={handleShuffleComplete}
            />
          </motion.div>
        )}

        {phase === "final-list" && (
          <motion.div
            key="final-list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <HorizontalResultsList
              products={sortedTrusted}
              bestPickId={bestPickId}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
