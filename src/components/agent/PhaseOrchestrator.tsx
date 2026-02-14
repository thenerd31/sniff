"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useAgentStore } from "@/stores/agentStore";
import { useShoppingAgent } from "@/hooks/useShoppingAgent";
import { useEffect } from "react";
import SearchBubble from "./SearchBubble";
import AgentThinking from "./AgentThinking";
import TwoColumnBoard from "./TwoColumnBoard";
import SortAnimation from "./SortAnimation";
import TopPickHighlight from "./TopPickHighlight";
import SaveConfirmation from "./SaveConfirmation";

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export default function PhaseOrchestrator() {
  const phase = useAgentStore((s) => s.phase);
  const query = useAgentStore((s) => s.query);
  const setPhase = useAgentStore((s) => s.setPhase);
  const { search } = useShoppingAgent();

  // If we arrive at /agent with a query already set (from landing page), start searching
  useEffect(() => {
    if (phase === "searching" && query?.text) {
      search(query.text, query.imageFile);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (text: string, image?: File) => {
    setPhase("searching");
    search(text, image);
  };

  const handleContinue = () => {
    setPhase("sorting");
  };

  return (
    <div className="flex-1">
      <AnimatePresence mode="wait">
        {phase === "idle" && (
          <motion.div
            key="idle"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center min-h-[70vh]"
          >
            <SearchBubble onSearch={handleSearch} />
          </motion.div>
        )}

        {phase === "searching" && (
          <motion.div
            key="searching"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <AgentThinking />
          </motion.div>
        )}

        {(phase === "reviewing" || phase === "swiping") && (
          <motion.div
            key="reviewing"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <TwoColumnBoard onContinue={handleContinue} />
          </motion.div>
        )}

        {phase === "sorting" && (
          <motion.div
            key="sorting"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <SortAnimation />
          </motion.div>
        )}

        {phase === "picked" && (
          <motion.div
            key="picked"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <TopPickHighlight />
          </motion.div>
        )}

        {phase === "saved" && (
          <motion.div
            key="saved"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <SaveConfirmation />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
