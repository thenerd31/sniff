"use client";

import { useRouter } from "next/navigation";
import Navbar from "@/components/agent/Navbar";
import SearchBubble from "@/components/agent/SearchBubble";
import FloatingBubbles from "@/components/agent/FloatingBubbles";
import { useAgentStore } from "@/stores/agentStore";

export default function Home() {
  const router = useRouter();
  const setQuery = useAgentStore((s) => s.setQuery);
  const setPhase = useAgentStore((s) => s.setPhase);

  const handleSearch = (text: string, imageFile?: File) => {
    setQuery({ text, imageFile });
    setPhase("searching");
    router.push("/agent");
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-b from-orange-500 via-orange-400 to-orange-200">
      <FloatingBubbles />
      <Navbar />
      <SearchBubble onSearch={handleSearch} />
    </div>
  );
}
