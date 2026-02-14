"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Lock,
  AlertTriangle,
  MessageSquare,
  User,
  ShoppingCart,
  Ticket,
  Mail,
  Search,
  Star,
  Building,
  TrendingUp,
  ArrowLeft,
  ChevronRight,
  ShoppingBag,
  Sparkles,
  FileSearch,
  Sword,
  Shield,
  Skull,
  Heart,
  Zap,
} from "lucide-react";
import type { EvidenceCard, CardSeverity, CardType } from "@/types";

/* ═══════════════════════════════════════════════════════════════
   PIXEL FONT HELPER
   ═══════════════════════════════════════════════════════════════ */

const PIXEL_FONT = "'Press Start 2P', monospace";

/* ═══════════════════════════════════════════════════════════════
   PSEUDO DATA
   ═══════════════════════════════════════════════════════════════ */

interface DemoEvent {
  delay: number;
  event: "card" | "connection" | "threat_score" | "log" | "done";
  data: any;
}

const DEMO_EVENTS: DemoEvent[] = [
  { delay: 400, event: "log", data: { text: "Starting investigation..." } },
  { delay: 600, event: "log", data: { text: "Resolving domain WHOIS records..." } },
  {
    delay: 800,
    event: "card",
    data: {
      id: "card-1",
      type: "domain",
      severity: "critical",
      title: "Domain registered 6 days ago",
      detail: "Registered Feb 7, 2026 via NameCheap. Registrant country: Nigeria. Domain age < 30 days is a strong fraud indicator.",
      source: "WHOIS Lookup",
      confidence: 0.92,
      connections: [],
      metadata: {},
    },
  },
  { delay: 500, event: "log", data: { text: "Analyzing SSL certificate chain..." } },
  {
    delay: 1000,
    event: "card",
    data: {
      id: "card-2",
      type: "ssl",
      severity: "critical",
      title: "SSL certificate mismatch",
      detail: "Certificate issued to *.cheaphost.xyz — a different domain. Strongly suggests phishing or impersonation.",
      source: "SSL Analysis",
      confidence: 0.95,
      connections: ["card-1"],
      metadata: {},
    },
  },
  { delay: 400, event: "connection", data: { from: "hero", to: "card-2" } },
  { delay: 300, event: "log", data: { text: "Searching Reddit for scam reports..." } },
  { delay: 600, event: "log", data: { text: "Found 12 matching threads in r/Scams..." } },
  {
    delay: 800,
    event: "card",
    data: {
      id: "card-3",
      type: "scam_report",
      severity: "critical",
      title: "12 scam reports on Reddit",
      detail: 'Multiple users in r/Scams report this domain. Top post: "Lost $200, never received product." — 847 upvotes.',
      source: "Reddit Search",
      confidence: 0.88,
      connections: ["card-1"],
      metadata: {},
    },
  },
  { delay: 400, event: "connection", data: { from: "card-2", to: "card-3" } },
  { delay: 300, event: "log", data: { text: "Scanning page for deceptive patterns..." } },
  {
    delay: 900,
    event: "card",
    data: {
      id: "card-4",
      type: "alert",
      severity: "warning",
      title: "No return policy found",
      detail: "No visible return or refund policy. Legitimate retailers are legally required to display this.",
      source: "Page Analysis",
      confidence: 0.78,
      connections: [],
      metadata: {},
    },
  },
  { delay: 400, event: "connection", data: { from: "card-3", to: "card-4" } },
  { delay: 400, event: "log", data: { text: "Detecting urgency manipulation tactics..." } },
  {
    delay: 800,
    event: "card",
    data: {
      id: "card-5",
      type: "alert",
      severity: "warning",
      title: "Fake urgency tactics detected",
      detail: 'Countdown timer and "Only 2 left!" pressure language. Common social engineering tactics.',
      source: "Page Analysis",
      confidence: 0.82,
      connections: ["card-4"],
      metadata: {},
    },
  },
  { delay: 400, event: "connection", data: { from: "card-4", to: "card-5" } },
  { delay: 300, event: "log", data: { text: "Querying Google Safe Browsing API..." } },
  {
    delay: 700,
    event: "card",
    data: {
      id: "card-6",
      type: "domain",
      severity: "safe",
      title: "Google Safe Browsing: not flagged",
      detail: "Not yet in Google's database. New scam sites often haven't been reported — absence of flag ≠ safety.",
      source: "Google Safe Browsing",
      confidence: 0.6,
      connections: [],
      metadata: {},
    },
  },
  { delay: 400, event: "connection", data: { from: "card-5", to: "card-6" } },
  { delay: 300, event: "log", data: { text: "Searching corporate registries..." } },
  { delay: 500, event: "log", data: { text: 'Looking up "LuxDeals Global Ltd"...' } },
  {
    delay: 900,
    event: "card",
    data: {
      id: "card-7",
      type: "business",
      severity: "critical",
      title: "No business registration found",
      detail: '"LuxDeals Global Ltd" returns zero results in corporate registries. Likely a fictitious entity.',
      source: "Business Registry",
      confidence: 0.85,
      connections: ["card-1", "card-3"],
      metadata: {},
    },
  },
  { delay: 400, event: "connection", data: { from: "card-6", to: "card-7" } },
  { delay: 300, event: "log", data: { text: "Running reverse image search on team photos..." } },
  {
    delay: 800,
    event: "card",
    data: {
      id: "card-8",
      type: "seller",
      severity: "warning",
      title: "Stock photos for team page",
      detail: "All 4 'team member' photos are Shutterstock stock images. No real team identified.",
      source: "Image Analysis",
      confidence: 0.9,
      connections: ["card-7"],
      metadata: {},
    },
  },
  { delay: 400, event: "connection", data: { from: "card-7", to: "card-8" } },
  { delay: 300, event: "log", data: { text: "Calculating final threat score..." } },
  { delay: 800, event: "threat_score", data: { score: 94 } },
  { delay: 400, event: "log", data: { text: "!! CRITICAL — threat score 94/100" } },
  {
    delay: 600,
    event: "done",
    data: {
      summary: "High risk of fraud. Domain 6 days old, SSL mismatch, 12 Reddit reports, no business registration. Threat score: 94/100. DO NOT proceed.",
    },
  },
];

/* ═══════════════════════════════════════════════════════════════
   PIXEL SEVERITY COLORS
   ═══════════════════════════════════════════════════════════════ */

const SEVERITY_COLORS: Record<CardSeverity, { border: string; bg: string; accent: string; text: string; barColor: string; label: string }> = {
  critical: { border: "#8B0000", bg: "#FFF0F0", accent: "#FF0000", text: "#8B0000", barColor: "#FF0000", label: "CRITICAL" },
  warning:  { border: "#8B6914", bg: "#FFFDE0", accent: "#FFD700", text: "#8B6914", barColor: "#FFD700", label: "WARNING" },
  info:     { border: "#00008B", bg: "#F0F0FF", accent: "#4444FF", text: "#00008B", barColor: "#4444FF", label: "INFO" },
  safe:     { border: "#006400", bg: "#F0FFF0", accent: "#00CC00", text: "#006400", barColor: "#00CC00", label: "SAFE" },
};

const TYPE_ICONS: Record<CardType, React.FC<{ className?: string }>> = {
  domain: Globe,
  ssl: Lock,
  scam_report: MessageSquare,
  review_analysis: Star,
  price: ShoppingCart,
  seller: User,
  business: Building,
  alert: AlertTriangle,
  email: Mail,
  alternative: TrendingUp,
  coupon: Ticket,
};

/* Horizontal linear positioning — all nodes on the same Y, strictly snapped */
const NODE_SPACING_X = 380;
const NODE_Y = 150;

function getLinearPosition(index: number): { x: number; y: number } {
  return {
    x: (index + 1) * NODE_SPACING_X,
    y: NODE_Y,
  };
}

/* ═══════════════════════════════════════════════════════════════
   PIXEL ART DOG SPRITE (inline SVG — 32x24 pixel art)
   ═══════════════════════════════════════════════════════════════ */

function PixelDog({ style, className }: { style?: React.CSSProperties; className?: string }) {
  return (
    <svg
      width="64"
      height="48"
      viewBox="0 0 32 24"
      className={className}
      style={{ imageRendering: "pixelated", ...style }}
    >
      {/* Body */}
      <rect x="8" y="10" width="14" height="8" fill="#D4A574" />
      <rect x="7" y="11" width="1" height="6" fill="#C49464" />
      <rect x="22" y="11" width="1" height="5" fill="#C49464" />
      {/* Head */}
      <rect x="20" y="5" width="8" height="7" fill="#D4A574" />
      <rect x="19" y="6" width="1" height="5" fill="#C49464" />
      <rect x="28" y="6" width="1" height="4" fill="#C49464" />
      {/* Ear */}
      <rect x="21" y="3" width="3" height="3" fill="#8B6914" />
      <rect x="25" y="3" width="3" height="3" fill="#8B6914" />
      {/* Eye */}
      <rect x="24" y="7" width="2" height="2" fill="#1A1A1A" />
      <rect x="25" y="7" width="1" height="1" fill="#FFFFFF" />
      {/* Nose */}
      <rect x="27" y="9" width="2" height="2" fill="#1A1A1A" />
      {/* Tail */}
      <rect x="5" y="8" width="3" height="2" fill="#8B6914" />
      <rect x="4" y="6" width="2" height="3" fill="#8B6914" />
      {/* Front legs */}
      <rect x="18" y="18" width="3" height="5" fill="#C49464" />
      <rect x="18" y="23" width="3" height="1" fill="#8B6914" />
      {/* Back legs */}
      <rect x="9" y="18" width="3" height="5" fill="#C49464" />
      <rect x="9" y="23" width="3" height="1" fill="#8B6914" />
      {/* Belly spot */}
      <rect x="12" y="14" width="4" height="3" fill="#E8C49C" />
      {/* Collar */}
      <rect x="19" y="11" width="4" height="2" fill="#FF0000" />
      <rect x="20" y="12" width="1" height="1" fill="#FFD700" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RUNNING DOG — follows the active node with state-based animation
   ═══════════════════════════════════════════════════════════════ */

/* Idle sniffing SVG — head bobs down */
function PixelDogIdle({ style, className }: { style?: React.CSSProperties; className?: string }) {
  return (
    <svg
      width="64"
      height="48"
      viewBox="0 0 32 24"
      className={className}
      style={{ imageRendering: "pixelated", ...style }}
    >
      {/* Body */}
      <rect x="8" y="10" width="14" height="8" fill="#D4A574" />
      <rect x="7" y="11" width="1" height="6" fill="#C49464" />
      <rect x="22" y="11" width="1" height="5" fill="#C49464" />
      {/* Head — tilted down for sniffing */}
      <rect x="20" y="7" width="8" height="7" fill="#D4A574" />
      <rect x="19" y="8" width="1" height="5" fill="#C49464" />
      <rect x="28" y="8" width="1" height="4" fill="#C49464" />
      {/* Ear */}
      <rect x="21" y="5" width="3" height="3" fill="#8B6914" />
      <rect x="25" y="5" width="3" height="3" fill="#8B6914" />
      {/* Eye — squinting */}
      <rect x="24" y="9" width="2" height="1" fill="#1A1A1A" />
      {/* Nose — lower, sniffing */}
      <rect x="27" y="12" width="2" height="2" fill="#1A1A1A" />
      {/* Sniff lines */}
      <rect x="29" y="11" width="1" height="1" fill="#8B691480" />
      <rect x="30" y="10" width="1" height="1" fill="#8B691440" />
      {/* Tail — up/wagging */}
      <rect x="5" y="6" width="3" height="2" fill="#8B6914" />
      <rect x="4" y="4" width="2" height="3" fill="#8B6914" />
      <rect x="3" y="3" width="2" height="2" fill="#8B6914" />
      {/* Front legs — standing */}
      <rect x="18" y="18" width="3" height="5" fill="#C49464" />
      <rect x="18" y="23" width="3" height="1" fill="#8B6914" />
      {/* Back legs — standing */}
      <rect x="9" y="18" width="3" height="5" fill="#C49464" />
      <rect x="9" y="23" width="3" height="1" fill="#8B6914" />
      {/* Belly spot */}
      <rect x="12" y="14" width="4" height="3" fill="#E8C49C" />
      {/* Collar */}
      <rect x="19" y="13" width="4" height="2" fill="#FF0000" />
      <rect x="20" y="14" width="1" height="1" fill="#FFD700" />
    </svg>
  );
}

const DOG_WIDTH = 64;
const DOG_PAW_OFFSET = 52; // y offset so paws sit on top border of node box

function RunningDog({
  targetNodeId,
  nodes,
  isMoving,
  containerWidth,
}: {
  targetNodeId: string;
  nodes: Node[];
  isMoving: boolean;
  containerWidth: number;
}) {
  const targetNode = nodes.find((n) => n.id === targetNodeId);
  // Center the dog on the node (node width ~280-320, dog is 64px)
  const nodeWidth = targetNodeId === "hero" ? 320 : 280;
  const rawX = targetNode ? targetNode.position.x + nodeWidth / 2 - DOG_WIDTH / 2 : 140;

  // Clamp to viewport so the dog never disappears off-screen
  const maxX = Math.max(0, containerWidth - DOG_WIDTH - 20);
  const x = Math.max(0, Math.min(rawX, maxX));

  // Paws planted on top border of the node
  const y = NODE_Y - DOG_PAW_OFFSET;

  return (
    <motion.div
      animate={{ x }}
      transition={
        isMoving
          ? { type: "spring", stiffness: 80, damping: 18, mass: 1.2 }
          : { type: "spring", stiffness: 200, damping: 30 }
      }
      className="pointer-events-none absolute"
      style={{ top: y, zIndex: 50 }}
    >
      {isMoving ? (
        <div style={{ animation: "dog-run 0.4s steps(1) infinite" }}>
          <PixelDog />
        </div>
      ) : (
        <div style={{ animation: "dog-bob 1.2s ease-in-out infinite" }}>
          <PixelDogIdle />
        </div>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SEGMENTED PIXEL BAR (HP / Power bar)
   ═══════════════════════════════════════════════════════════════ */

function PixelBar({ value, maxValue = 100, color, height = 12 }: { value: number; maxValue?: number; color: string; height?: number }) {
  const segments = 10;
  const filledSegments = Math.round((value / maxValue) * segments);

  return (
    <div
      className="flex gap-[2px]"
      style={{ height, border: "2px solid #1A1A1A", padding: 2, background: "#2A2A2A" }}
    >
      {Array.from({ length: segments }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            background: i < filledSegments ? color : "#444",
            imageRendering: "pixelated",
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PIXEL DIALOGUE BOX (shared frame for all cards)
   ═══════════════════════════════════════════════════════════════ */

function PixelFrame({ children, className, borderColor = "#1A1A1A" }: { children: React.ReactNode; className?: string; borderColor?: string }) {
  return (
    <div
      className={className}
      style={{
        border: `4px solid ${borderColor}`,
        borderRadius: 0,
        background: "#FFF8E8",
        boxShadow: `4px 4px 0 ${borderColor}`,
        imageRendering: "pixelated",
        position: "relative",
      }}
    >
      {/* Inner border for dialogue-box feel */}
      <div
        style={{
          position: "absolute",
          inset: 3,
          border: `2px solid ${borderColor}40`,
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SKY + GRASS BACKGROUND (top half)
   ═══════════════════════════════════════════════════════════════ */

function GameBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* Sky gradient — grass starts at ~70% */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to bottom, #87CEEB 0%, #B0E0FF 50%, #C8E6B0 65%, #98D982 70%, #5EAA42 80%, #4A8C34 100%)",
        }}
      />
      {/* Pixel clouds */}
      <div className="absolute left-[10%] top-[8%]" style={{ opacity: 0.7 }}>
        <svg width="80" height="32" viewBox="0 0 20 8" style={{ imageRendering: "pixelated" }}>
          <rect x="4" y="4" width="12" height="4" fill="white" />
          <rect x="2" y="4" width="2" height="2" fill="white" />
          <rect x="16" y="4" width="2" height="2" fill="white" />
          <rect x="6" y="2" width="4" height="2" fill="white" />
          <rect x="12" y="2" width="3" height="2" fill="white" />
          <rect x="8" y="0" width="3" height="2" fill="white" />
        </svg>
      </div>
      <div className="absolute right-[20%] top-[14%]" style={{ opacity: 0.5 }}>
        <svg width="60" height="24" viewBox="0 0 15 6" style={{ imageRendering: "pixelated" }}>
          <rect x="2" y="3" width="11" height="3" fill="white" />
          <rect x="4" y="1" width="3" height="2" fill="white" />
          <rect x="9" y="1" width="2" height="2" fill="white" />
        </svg>
      </div>
      <div className="absolute left-[55%] top-[5%]" style={{ opacity: 0.6 }}>
        <svg width="48" height="20" viewBox="0 0 12 5" style={{ imageRendering: "pixelated" }}>
          <rect x="1" y="2" width="10" height="3" fill="white" />
          <rect x="3" y="0" width="4" height="2" fill="white" />
        </svg>
      </div>
      {/* Grass line detail — only bottom 30% */}
      <div
        className="absolute bottom-0 left-0 w-full"
        style={{
          height: "30%",
          backgroundImage: "repeating-linear-gradient(90deg, #4A8C34 0px, #4A8C34 8px, #5EAA42 8px, #5EAA42 16px)",
          imageRendering: "pixelated",
        }}
      />
      {/* Ground pixel pattern */}
      <svg className="absolute bottom-0 left-0 w-full" height="40" style={{ imageRendering: "pixelated" }}>
        <pattern id="grass-tufts" x="0" y="0" width="16" height="8" patternUnits="userSpaceOnUse">
          <rect x="2" y="0" width="2" height="4" fill="#3D7A2E" />
          <rect x="10" y="2" width="2" height="3" fill="#3D7A2E" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#grass-tufts)" />
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DIRT / UNDERGROUND BACKGROUND (bottom half)
   ═══════════════════════════════════════════════════════════════ */

function DirtBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* Base dirt color */}
      <div className="absolute inset-0" style={{ background: "#C4A46C" }} />
      {/* Vertical stripes for dirt layers */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "repeating-linear-gradient(90deg, #B8956A 0px, #B8956A 6px, #C4A46C 6px, #C4A46C 12px, #D4B87C 12px, #D4B87C 18px, #C4A46C 18px, #C4A46C 24px)",
          imageRendering: "pixelated",
        }}
      />
      {/* Horizontal layers */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "repeating-linear-gradient(to bottom, transparent 0px, transparent 14px, #A8855A33 14px, #A8855A33 16px)",
          imageRendering: "pixelated",
        }}
      />
      {/* Scattered pixel rocks */}
      <svg className="absolute inset-0 h-full w-full" style={{ imageRendering: "pixelated", opacity: 0.15 }}>
        <pattern id="dirt-rocks" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
          <rect x="4" y="8" width="3" height="3" fill="#8B7355" />
          <rect x="20" y="18" width="2" height="2" fill="#7A6548" />
          <rect x="12" y="26" width="4" height="2" fill="#8B7355" />
          <rect x="24" y="4" width="2" height="3" fill="#6B5B3E" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#dirt-rocks)" />
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HERO PRODUCT CARD NODE — "Quest Card" style
   ═══════════════════════════════════════════════════════════════ */

function HeroCardNode({ data }: { data: { url: string; threatScore: number; status: string; summary: string } }) {
  const barColor = data.threatScore < 25
    ? "#00CC00"
    : data.threatScore < 50
    ? "#FFD700"
    : data.threatScore < 75
    ? "#FF8800"
    : "#FF0000";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 22 }}
    >
      <PixelFrame className="w-[320px] p-4">
        <Handle type="source" position={Position.Right} className="!bg-[#1A1A1A] !border-[#1A1A1A] !w-3 !h-3 !rounded-none" />

        {/* Header */}
        <div className="mb-3 flex items-center gap-2">
          <Shield className="h-5 w-5" style={{ color: "#8B6914" }} />
          <span style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: "#1A1A1A", letterSpacing: 1 }}>
            QUEST TARGET
          </span>
        </div>

        {/* URL in pixel box */}
        <div
          className="mb-3 flex items-center gap-2 px-3 py-2"
          style={{ border: "2px solid #1A1A1A", background: "#FFF0D4" }}
        >
          <Globe className="h-3.5 w-3.5 shrink-0" style={{ color: "#8B6914" }} />
          <span
            className="truncate"
            style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: "#4A3A2A" }}
          >
            {data.url}
          </span>
        </div>

        {/* Threat score — HP bar style */}
        <div className="mb-3">
          <div className="mb-1.5 flex items-center justify-between">
            <span style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: "#8B6914" }}>
              THREAT LV
            </span>
            <span style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: barColor, fontWeight: "bold" }}>
              {data.threatScore > 0 ? `${data.threatScore}/100` : "---"}
            </span>
          </div>
          <PixelBar value={data.threatScore} color={barColor} />
        </div>

        {/* Verdict */}
        <AnimatePresence>
          {data.summary ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
            >
              <div style={{ border: "3px solid #8B0000", background: "#FFF0F0", padding: 10 }}>
                <div className="mb-1 flex items-center gap-1.5">
                  <Skull className="h-3.5 w-3.5" style={{ color: "#8B0000" }} />
                  <span style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: "#8B0000" }}>VERDICT</span>
                </div>
                <p style={{ fontFamily: PIXEL_FONT, fontSize: 6, lineHeight: 1.8, color: "#4A3A2A" }}>
                  {data.summary}
                </p>
              </div>
            </motion.div>
          ) : data.status === "investigating" ? (
            <div
              className="flex items-center gap-2 px-3 py-2"
              style={{ border: "2px solid #8B6914", background: "#FFF8E0" }}
            >
              <div
                className="h-2 w-2"
                style={{ background: "#FFD700", animation: "pixel-blink 1s steps(1) infinite" }}
              />
              <span style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: "#8B6914" }}>
                SNIFFING...
              </span>
            </div>
          ) : null}
        </AnimatePresence>
      </PixelFrame>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EVIDENCE CARD NODE — game dialogue box
   ═══════════════════════════════════════════════════════════════ */

function EvidenceCardNode({ data }: { data: EvidenceCard & { isNew: boolean } }) {
  const colors = SEVERITY_COLORS[data.severity];
  const TypeIcon = TYPE_ICONS[data.type] || AlertTriangle;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.3, x: 60 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
    >
      <PixelFrame className="relative w-[280px] p-3" borderColor={colors.border}>
        {/* Flash on arrival */}
        {data.isNew && (
          <motion.div
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="pointer-events-none absolute inset-0"
            style={{ background: colors.accent + "30", zIndex: 50 }}
          />
        )}

        <Handle type="target" position={Position.Left} className="!bg-[#1A1A1A] !border-[#1A1A1A] !w-2.5 !h-2.5 !rounded-none" />
        <Handle type="source" position={Position.Right} className="!bg-[#1A1A1A] !border-[#1A1A1A] !w-2.5 !h-2.5 !rounded-none" />

        {/* Header */}
        <div className="mb-2 flex items-center gap-2">
          <TypeIcon className={`h-4 w-4 ${colors.text}`} />
          <span className="flex-1 truncate" style={{ fontFamily: PIXEL_FONT, fontSize: 6, color: "#8B6914" }}>
            {data.source}
          </span>
          <span
            style={{
              fontFamily: PIXEL_FONT,
              fontSize: 6,
              color: colors.text,
              border: `2px solid ${colors.border}`,
              background: colors.bg,
              padding: "2px 6px",
            }}
          >
            {colors.label}
          </span>
        </div>

        {/* Title */}
        <h3
          className="mb-1"
          style={{ fontFamily: PIXEL_FONT, fontSize: 8, lineHeight: 1.6, color: "#1A1A1A" }}
        >
          {data.title}
        </h3>

        {/* Detail */}
        <p
          className="mb-2 line-clamp-2"
          style={{ fontFamily: PIXEL_FONT, fontSize: 6, lineHeight: 1.8, color: "#4A3A2A" }}
        >
          {data.detail}
        </p>

        {/* Confidence — power bar */}
        <div className="flex items-center gap-2">
          <span style={{ fontFamily: PIXEL_FONT, fontSize: 6, color: "#8B6914" }}>PWR</span>
          <div className="flex-1">
            <PixelBar value={data.confidence * 100} color={colors.barColor} height={8} />
          </div>
          <span style={{ fontFamily: PIXEL_FONT, fontSize: 6, color: colors.text }}>
            {Math.round(data.confidence * 100)}%
          </span>
        </div>
      </PixelFrame>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   QUEST LOG (sidebar)
   ═══════════════════════════════════════════════════════════════ */

interface LogEntry {
  id: number;
  text: string;
  timestamp: string;
}

function QuestLog({ logs }: { logs: LogEntry[] }) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollAreaRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs.length]);

  return (
    <PixelFrame className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: "3px solid #1A1A1A", background: "#8B6914" }}
      >
        <Sparkles className="h-4 w-4" style={{ color: "#FFD700" }} />
        <span style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: "#FFF8E8", letterSpacing: 1 }}>
          QUEST LOG
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <Heart className="h-3 w-3" style={{ color: "#FF0000" }} />
          <Heart className="h-3 w-3" style={{ color: "#FF0000" }} />
          <Heart className="h-3 w-3" style={{ color: "#FF000040" }} />
        </div>
      </div>

      {/* Log entries */}
      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-3">
        <AnimatePresence>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15 }}
              className="mb-2 flex gap-2"
            >
              <span style={{ fontFamily: PIXEL_FONT, fontSize: 6, color: "#8B6914", flexShrink: 0 }}>
                {log.timestamp}
              </span>
              <ChevronRight className="mt-0.5 h-3 w-3 shrink-0" style={{ color: "#FFD700" }} />
              <span
                style={{
                  fontFamily: PIXEL_FONT,
                  fontSize: 6,
                  lineHeight: 1.8,
                  color: log.text.startsWith("!!") ? "#FF0000" : "#4A3A2A",
                }}
              >
                {log.text}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </PixelFrame>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DIG DEEPER — pixel buttons
   ═══════════════════════════════════════════════════════════════ */

const DIG_ACTIONS = [
  { label: "Reviews", icon: Star, focus: "reviews" },
  { label: "Seller", icon: User, focus: "seller" },
  { label: "Prices", icon: ShoppingCart, focus: "price_history" },
  { label: "Alts", icon: TrendingUp, focus: "alternatives" },
  { label: "Biz", icon: Building, focus: "business" },
] as const;

function DigDeeperPanel({
  disabled,
  onAction,
}: {
  disabled: boolean;
  onAction: (focus: string) => void;
}) {
  return (
    <PixelFrame className="shrink-0 p-3">
      <div className="mb-2 flex items-center gap-2">
        <Sword className="h-4 w-4" style={{ color: "#8B6914" }} />
        <span style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: "#1A1A1A" }}>ABILITIES</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {DIG_ACTIONS.map((a) => (
          <button
            key={a.focus}
            onClick={() => onAction(a.focus)}
            disabled={disabled}
            className="pixel-btn flex items-center gap-2 px-3 py-2 text-left"
            style={{
              border: "3px solid #1A1A1A",
              background: disabled ? "#D4C4A0" : "#FFF8E8",
              fontFamily: PIXEL_FONT,
              fontSize: 6,
              color: "#1A1A1A",
              cursor: disabled ? "not-allowed" : "pointer",
            }}
          >
            <a.icon className="h-3.5 w-3.5 shrink-0" style={{ color: "#8B6914" }} />
            {a.label}
          </button>
        ))}
      </div>
    </PixelFrame>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FINDING CARD — underground results
   ═══════════════════════════════════════════════════════════════ */

function FindingCard({ card, index }: { card: EvidenceCard; index: number }) {
  const colors = SEVERITY_COLORS[card.severity];
  const TypeIcon = TYPE_ICONS[card.type] || AlertTriangle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08, ease: "easeOut" }}
    >
      <PixelFrame className="p-5" borderColor={colors.border}>
        <div className="mb-3 flex items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center"
            style={{ border: `2px solid ${colors.border}`, background: colors.bg }}
          >
            <TypeIcon className={`h-4 w-4 ${colors.text}`} />
          </div>
          <div className="flex-1">
            <h4 style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: "#1A1A1A", lineHeight: 1.4 }}>
              {card.title}
            </h4>
            <p style={{ fontFamily: PIXEL_FONT, fontSize: 6, color: "#8B6914" }}>{card.source}</p>
          </div>
          <span
            style={{
              fontFamily: PIXEL_FONT,
              fontSize: 6,
              color: colors.text,
              border: `2px solid ${colors.border}`,
              background: colors.bg,
              padding: "2px 6px",
            }}
          >
            {colors.label}
          </span>
        </div>
        <p style={{ fontFamily: PIXEL_FONT, fontSize: 7, lineHeight: 2, color: "#4A3A2A", marginBottom: 12 }}>
          {card.detail}
        </p>
        <div className="flex items-center gap-2">
          <span style={{ fontFamily: PIXEL_FONT, fontSize: 6, color: "#8B6914" }}>POWER</span>
          <div className="flex-1">
            <PixelBar value={card.confidence * 100} color={colors.barColor} height={10} />
          </div>
          <span style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: colors.text, fontWeight: "bold" }}>
            {Math.round(card.confidence * 100)}%
          </span>
        </div>
      </PixelFrame>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   RESULTS SECTION — underground theme
   ═══════════════════════════════════════════════════════════════ */

function ResultsSection({
  status,
  summary,
  findings,
  threatScore,
  resultsRef,
}: {
  status: string;
  summary: string;
  findings: EvidenceCard[];
  threatScore: number;
  resultsRef: React.RefObject<HTMLDivElement | null>;
}) {
  const barColor = threatScore < 25
    ? "#00CC00"
    : threatScore < 50
    ? "#FFD700"
    : threatScore < 75
    ? "#FF8800"
    : "#FF0000";

  return (
    <div ref={resultsRef} className="relative min-h-screen px-8 py-10">
      <DirtBackground />

      <div className="relative z-10 mx-auto flex max-w-[720px] flex-col gap-5">
        {status === "complete" && summary ? (
          <>
            {/* Summary header — boss defeated card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <PixelFrame className="p-8">
                <div className="mb-5 flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center"
                    style={{ border: "3px solid #8B0000", background: "#FFF0F0" }}
                  >
                    <Skull className="h-6 w-6" style={{ color: "#8B0000" }} />
                  </div>
                  <div className="flex-1">
                    <h3 style={{ fontFamily: PIXEL_FONT, fontSize: 12, color: "#1A1A1A" }}>
                      QUEST COMPLETE!
                    </h3>
                    <p style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: "#8B6914", marginTop: 4 }}>
                      Final analysis and loot
                    </p>
                  </div>
                </div>

                {/* Threat score bar */}
                <div className="mb-5">
                  <div className="mb-2 flex items-center justify-between">
                    <span style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: "#8B6914" }}>
                      BOSS THREAT LEVEL
                    </span>
                    <span style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: barColor, fontWeight: "bold" }}>
                      {threatScore}/100
                    </span>
                  </div>
                  <PixelBar value={threatScore} color={barColor} height={16} />
                </div>

                <div style={{ border: "3px solid #8B0000", background: "#FFF0F0", padding: 16 }}>
                  <p style={{ fontFamily: PIXEL_FONT, fontSize: 7, lineHeight: 2, color: "#4A3A2A" }}>
                    {summary}
                  </p>
                </div>
              </PixelFrame>
            </motion.div>

            {/* Section label */}
            <div className="flex items-center gap-3 px-1 pt-2">
              <Zap className="h-4 w-4" style={{ color: "#FFD700" }} />
              <span style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: "#FFF8E8", letterSpacing: 1 }}>
                EVIDENCE LOOT ({findings.length})
              </span>
              <div className="h-[3px] flex-1" style={{ background: "#8B6914" }} />
            </div>

            {/* Vertical finding cards */}
            {findings.map((card, i) => (
              <FindingCard key={card.id} card={card} index={i} />
            ))}

            <div className="h-10" />
          </>
        ) : (
          <div className="flex min-h-[25vh] flex-col items-center justify-center gap-4 text-center">
            <PixelFrame className="p-6">
              <div className="flex flex-col items-center gap-3">
                <FileSearch className="h-8 w-8" style={{ color: "#8B6914" }} />
                <p style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: "#1A1A1A" }}>
                  AWAITING RESULTS
                </p>
                <p style={{ fontFamily: PIXEL_FONT, fontSize: 6, color: "#8B6914", lineHeight: 1.8 }}>
                  Results will appear after the quest is complete.
                </p>
                {status === "investigating" && (
                  <div className="flex items-center gap-2 pt-2">
                    <div className="h-2 w-2" style={{ background: "#FFD700", animation: "pixel-blink 1s steps(1) infinite" }} />
                    <div className="h-2 w-2" style={{ background: "#FFD700", animation: "pixel-blink 1s steps(1) infinite", animationDelay: "0.33s" }} />
                    <div className="h-2 w-2" style={{ background: "#FFD700", animation: "pixel-blink 1s steps(1) infinite", animationDelay: "0.66s" }} />
                  </div>
                )}
              </div>
            </PixelFrame>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BOARD PAGE
   ═══════════════════════════════════════════════════════════════ */

const nodeTypes: NodeTypes = {
  evidenceCard: EvidenceCardNode,
  heroCard: HeroCardNode,
};

export default function BoardPage() {
  const searchParams = useSearchParams();
  const targetUrl = searchParams.get("url") || "https://www.example.com";

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [threatScore, setThreatScore] = useState(0);
  const [status, setStatus] = useState<"investigating" | "complete">("investigating");
  const [summary, setSummary] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [findings, setFindings] = useState<EvidenceCard[]>([]);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [activeNodeId, setActiveNodeId] = useState("hero");
  const [dogMoving, setDogMoving] = useState(false);
  const [flowContainerWidth, setFlowContainerWidth] = useState(800);
  const cardCountRef = useRef(0);
  const logIdRef = useRef(0);
  const hasStarted = useRef(false);
  const prevCardIdRef = useRef("hero");
  const resultsRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const reactFlowSectionRef = useRef<HTMLDivElement>(null);

  function addLog(text: string) {
    const now = new Date();
    const ts = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
    setLogs((prev) => [...prev, { id: logIdRef.current++, text, timestamp: ts }]);
  }

  // Auto-scroll to results when investigation completes — slow cinematic ease
  useEffect(() => {
    if (status === "complete" && resultsRef.current && scrollContainerRef.current) {
      const timer = setTimeout(() => {
        const container = scrollContainerRef.current;
        const target = resultsRef.current;
        if (!container || !target) return;

        const start = container.scrollTop;
        const flowSection = reactFlowSectionRef.current;
        const end = flowSection
          ? flowSection.offsetTop + flowSection.offsetHeight
          : target.offsetTop;
        const distance = end - start;
        const duration = 1400;
        let startTime: number | null = null;

        function ease(t: number) {
          return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        }

        function step(timestamp: number) {
          if (!startTime) startTime = timestamp;
          const elapsed = timestamp - startTime;
          const progress = Math.min(elapsed / duration, 1);
          container!.scrollTop = start + distance * ease(progress);
          if (progress < 1) requestAnimationFrame(step);
        }

        requestAnimationFrame(step);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [status]);

  useEffect(() => {
    const t = setTimeout(() => setSidebarVisible(true), 200);
    return () => clearTimeout(t);
  }, []);

  // Track React Flow container width for dog bounding box
  useEffect(() => {
    const el = reactFlowSectionRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setFlowContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const heroNode: Node = {
      id: "hero",
      type: "heroCard",
      position: { x: 0, y: NODE_Y - 20 },
      data: { url: targetUrl, threatScore: 0, status: "investigating", summary: "" },
      draggable: true,
    };
    setNodes([heroNode]);
  }, [targetUrl, setNodes]);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    let cancelled = false;

    async function runDemo() {
      for (const evt of DEMO_EVENTS) {
        if (cancelled) break;
        await new Promise((r) => setTimeout(r, evt.delay));
        if (cancelled) break;

        switch (evt.event) {
          case "log": {
            addLog(evt.data.text);
            // Dog is "thinking" / sniffing during log phases
            setDogMoving(false);
            break;
          }
          case "card": {
            const card = evt.data as EvidenceCard;
            const pos = getLinearPosition(cardCountRef.current);
            cardCountRef.current++;
            addLog(`Evidence found: ${card.title}`);

            setFindings((prev) => [...prev, card]);
            setDogMoving(true);
            setActiveNodeId(card.id);
            // Switch to idle/sniffing after the dog arrives (~800ms)
            setTimeout(() => setDogMoving(false), 800);

            const newNode: Node = {
              id: card.id,
              type: "evidenceCard",
              position: pos,
              data: { ...card, isNew: true },
            };
            setNodes((prev) => [...prev, newNode]);

            const sourceId = prevCardIdRef.current;
            setEdges((prev) => [
              ...prev,
              {
                id: `${sourceId}-${card.id}`,
                source: sourceId,
                target: card.id,
                type: "straight",
                animated: true,
                style: { stroke: "#1A1A1A", strokeWidth: 3 },
              },
            ]);
            prevCardIdRef.current = card.id;

            setTimeout(() => {
              setNodes((prev) =>
                prev.map((n) =>
                  n.id === card.id ? { ...n, data: { ...n.data, isNew: false } } : n
                )
              );
            }, 2500);
            break;
          }
          case "connection": {
            break;
          }
          case "threat_score": {
            const score = evt.data.score;
            setThreatScore(score);
            setNodes((prev) =>
              prev.map((n) =>
                n.id === "hero" ? { ...n, data: { ...n.data, threatScore: score } } : n
              )
            );
            break;
          }
          case "done": {
            setStatus("complete");
            setSummary(evt.data.summary);
            addLog("Quest complete!");
            setNodes((prev) =>
              prev.map((n) =>
                n.id === "hero"
                  ? { ...n, data: { ...n.data, status: "complete", summary: evt.data.summary } }
                  : n
              )
            );
            break;
          }
        }
      }
    }

    runDemo();
    return () => { cancelled = true; };
  }, [setNodes, setEdges]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      {/* ── Fixed Top bar — pixel style ── */}
      <header
        className="relative z-30 flex shrink-0 items-center gap-4 px-5 py-2.5"
        style={{
          borderBottom: "4px solid #1A1A1A",
          background: "#8B6914",
          boxShadow: "0 4px 0 #6B5210",
        }}
      >
        <a href="/" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" style={{ color: "#FFF8E8" }} />
          <div
            className="flex h-7 w-7 items-center justify-center"
            style={{ border: "2px solid #1A1A1A", background: "#FFD700" }}
          >
            <ShoppingBag className="h-3.5 w-3.5" style={{ color: "#1A1A1A" }} />
          </div>
          <span style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: "#FFF8E8" }}>Sniff</span>
        </a>

        <div className="mx-3 h-5 w-[3px]" style={{ background: "#6B5210" }} />

        <div
          className="flex min-w-0 flex-1 items-center gap-2 px-3 py-1.5"
          style={{ border: "2px solid #1A1A1A", background: "#FFF8E8" }}
        >
          <Search className="h-3 w-3 shrink-0" style={{ color: "#8B6914" }} />
          <span className="truncate" style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: "#4A3A2A" }}>
            {targetUrl}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {status === "investigating" ? (
            <>
              <div
                className="h-3 w-3"
                style={{ background: "#FFD700", animation: "pixel-blink 1s steps(1) infinite" }}
              />
              <span style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: "#FFD700" }}>SNIFFING</span>
            </>
          ) : (
            <>
              <div className="h-3 w-3" style={{ background: "#00CC00" }} />
              <span style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: "#00CC00" }}>COMPLETE</span>
            </>
          )}
        </div>
      </header>

      {/* ── Body: Sticky sidebar + Scrollable right content ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — Quest Log style */}
        <AnimatePresence>
          {sidebarVisible && (
            <motion.aside
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 26 }}
              className="relative z-20 flex h-full w-[320px] shrink-0 flex-col gap-3 p-3"
              style={{
                borderRight: "4px solid #1A1A1A",
                background: "#D4C4A0",
                boxShadow: "inset -4px 0 0 #B8A888",
              }}
            >
              <QuestLog logs={logs} />
              <DigDeeperPanel
                disabled={status === "investigating"}
                onAction={(focus) => {
                  addLog(`Using ability: ${focus}...`);
                }}
              />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Right content — single scrollable column */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
          {/* ── React Flow canvas — sky + grass ── */}
          <div ref={reactFlowSectionRef} className="relative h-[50vh] shrink-0 overflow-hidden">
            <GameBackground />

            <div className="relative z-10 h-full w-full">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.3, maxZoom: 0.75 }}
                minZoom={0.1}
                maxZoom={1.2}
                proOptions={{ hideAttribution: true }}
                style={{ background: "transparent" }}
                panOnDrag
                zoomOnScroll
              >
                <Controls
                  className="!bg-[#FFF8E8] !border-[#1A1A1A] !rounded-none !border-[3px] !shadow-[3px_3px_0_#1A1A1A] [&>button]:!bg-[#FFF8E8] [&>button]:!border-[#1A1A1A] [&>button]:!rounded-none [&>button]:!text-[#4A3A2A] [&>button:hover]:!bg-[#FFD700]"
                />
              </ReactFlow>

              {/* Running dog overlay — z-50 to walk in front of edges */}
              <div className="pointer-events-none absolute inset-0" style={{ zIndex: 50 }}>
                <RunningDog
                  targetNodeId={activeNodeId}
                  nodes={nodes}
                  isMoving={dogMoving}
                  containerWidth={flowContainerWidth}
                />
              </div>
            </div>
          </div>

          {/* ── Separator: grass → dirt ── */}
          <div className="relative z-20">
            <div className="h-[4px] w-full" style={{ background: "#1A1A1A" }} />
            <div
              className="h-3 w-full"
              style={{
                background: "linear-gradient(to bottom, #4A8C34, #8B7355)",
                imageRendering: "pixelated",
              }}
            />
          </div>

          {/* ── Results section — underground ── */}
          <ResultsSection
            status={status}
            summary={summary}
            findings={findings}
            threatScore={threatScore}
            resultsRef={resultsRef}
          />
        </div>
      </div>
    </div>
  );
}
