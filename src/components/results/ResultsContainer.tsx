"use client";

import { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useResultsStore,
  useTrusted,
  useFlagged,
  useSortedTrusted,
} from "@/stores/resultsStore";
import { TwoColumnLayout } from "./TwoColumnLayout";
import { BlackHoleWipe } from "./BlackHoleWipe";
import { ShuffleSort } from "./ShuffleSort";
import { HorizontalResultsList } from "./HorizontalResultsList";

export function ResultsContainer() {
  const phase = useResultsStore((s) => s.phase);
  const setPhase = useResultsStore((s) => s.setPhase);
  const bestPickId = useResultsStore((s) => s.bestPickId);

  const trusted = useTrusted();
  const flagged = useFlagged();
  const sortedTrusted = useSortedTrusted();

  // Seamless chain: eliminate → wipe → shuffle → final list
  const handleEliminateFlagged = useCallback(() => {
    setPhase("wiping");
  }, [setPhase]);

  const handleWipeComplete = useCallback(() => {
    setPhase("shuffling");
  }, [setPhase]);

  const handleShuffleComplete = useCallback(() => {
    setPhase("final-list");
  }, [setPhase]);
  const handleContinue = useCallback(() => {                                                                                        
    setPhase("done");                                                                                                                 
  }, [setPhase]);                                                                                                                   

  if (phase === "hidden") return null;

  return (
    <motion.section
      className="w-full px-6 md:px-12 lg:px-20 py-10"
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring" as const, stiffness: 180, damping: 22, delay: 0.1 }}
    >
      {/* Two Columns phase — uses AnimatePresence for exit animation */}
      <AnimatePresence>
        {phase === "two-columns" && (
          <motion.div
            key="two-columns"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, transition: { duration: 0.25 } }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <TwoColumnLayout
              trusted={trusted}
              flagged={flagged}
              onEliminateFlagged={handleEliminateFlagged}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* BlackHoleWipe — pure CSS animations, no Framer Motion needed for animation.
          Rendered directly (not inside AnimatePresence) to avoid interference. */}
      {phase === "wiping" && (
        <BlackHoleWipe
          flaggedProducts={flagged}
          onComplete={handleWipeComplete}
        />
      )}

      {/* ShuffleSort — pure CSS animations */}
      {phase === "shuffling" && (
        <ShuffleSort
          products={trusted}
          onComplete={handleShuffleComplete}
        />
      )}

      {/* Final Horizontal List */}
      {phase === "final-list" && (
        <motion.div
          key="final-list"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <HorizontalResultsList
            products={sortedTrusted}
            bestPickId={bestPickId}
            onContinue={handleContinue}
          />
        </motion.div>
      )}
    </motion.section>
  );
}
