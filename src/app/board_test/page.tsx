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
  Sword,
  Shield,
  Skull,
  Heart,
} from "lucide-react";
import type { EvidenceCard, CardSeverity, CardType, ProductResult, FraudCheck, ProductVerdict } from "@/types";
import { useResultsStore } from "@/stores/resultsStore";
import { ResultsContainer } from "@/components/results/ResultsContainer";
import "@/styles/results.css";

/* mock data removed — using real /api/search SSE */

/* ═══════════════════════════════════════════════════════════════
   PIXEL FONT HELPER
   ═══════════════════════════════════════════════════════════════ */

const PIXEL_FONT = "'Press Start 2P', monospace";

/* DEMO_EVENTS removed — using real /api/search SSE */

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
   DOG NODE — Custom React Flow node for the Sniff character
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

const DOG_NODE_ID = "sniff-dog";
const DOG_WIDTH = 64;
const DOG_PAW_OFFSET = 52;

function DogNode({ data }: { data: { isMoving: boolean } }) {
  return (
    <div className="pointer-events-none" style={{ width: DOG_WIDTH, height: 48 }}>
      {data.isMoving ? (
        <div style={{ animation: "dog-run 0.4s steps(1) infinite" }}>
          <PixelDog />
        </div>
      ) : (
        <div style={{ animation: "dog-bob 1.2s ease-in-out infinite" }}>
          <PixelDogIdle />
        </div>
      )}
    </div>
  );
}

/** Calculate the dog node position so its paws sit on top of the target node */
function getDogPosition(targetNodeId: string, cardIndex: number): { x: number; y: number } {
  const nodeWidth = targetNodeId === "hero" ? 320 : 280;
  const targetX = targetNodeId === "hero" ? 0 : (cardIndex + 1) * NODE_SPACING_X;
  return {
    x: targetX + nodeWidth / 2 - DOG_WIDTH / 2,
    y: NODE_Y - DOG_PAW_OFFSET,
  };
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
      <div className="flex flex-col" style={{ position: "relative", zIndex: 1, minHeight: 0, flex: "1 1 0%" }}>
        {children}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SKY + GRASS BACKGROUND (top half)
   ═══════════════════════════════════════════════════════════════ */

function PixelTree({ x, scale = 1 }: { x: string; scale?: number }) {
  const w = 48 * scale;
  const h = 72 * scale;
  return (
    <div className="absolute" style={{ left: x, bottom: "4%", transform: `translateX(-50%)` }}>
      <svg
        width={w}
        height={h}
        viewBox="0 0 16 24"
        style={{ imageRendering: "pixelated" }}
      >
        {/* Trunk */}
        <rect x="6" y="16" width="4" height="8" fill="#8B5E3C" />
        <rect x="7" y="16" width="2" height="8" fill="#6B4226" />
        {/* Foliage — bottom layer */}
        <rect x="2" y="10" width="12" height="6" fill="#3D7A2E" />
        {/* Foliage — middle layer */}
        <rect x="3" y="6" width="10" height="5" fill="#4A8C34" />
        {/* Foliage — top layer */}
        <rect x="5" y="2" width="6" height="5" fill="#5EAA42" />
        {/* Foliage — tip */}
        <rect x="6" y="0" width="4" height="3" fill="#6BC850" />
        {/* Highlight pixels */}
        <rect x="4" y="8" width="2" height="2" fill="#5EAA42" />
        <rect x="9" y="11" width="2" height="2" fill="#4A8C34" />
        <rect x="6" y="4" width="2" height="2" fill="#6BC850" />
      </svg>
    </div>
  );
}

function GameBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* Sky gradient — grass starts at ~85% */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to bottom, #87CEEB 0%, #B0E0FF 60%, #C8E6B0 82%, #98D982 86%, #5EAA42 92%, #4A8C34 100%)",
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

      {/* Pixel trees */}
      <PixelTree x="5%" scale={1.2} />
      <PixelTree x="15%" scale={0.9} />
      <PixelTree x="30%" scale={1.4} />
      <PixelTree x="70%" scale={1.1} />
      <PixelTree x="85%" scale={1.3} />
      <PixelTree x="95%" scale={0.8} />

      {/* Grass line detail — only bottom 14% */}
      <div
        className="absolute bottom-0 left-0 w-full"
        style={{
          height: "14%",
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
          <span style={{ color: colors.text }}><TypeIcon className="h-4 w-4" /></span>
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
   DIGGING PLACEHOLDER — shown while agent is still investigating
   ═══════════════════════════════════════════════════════════════ */

function PixelShovel() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 16 16"
      style={{ imageRendering: "pixelated" }}
    >
      {/* Handle */}
      <rect x="7" y="0" width="2" height="2" fill="#8B6914" />
      <rect x="7" y="2" width="2" height="6" fill="#A07828" />
      <rect x="6" y="2" width="1" height="1" fill="#C49464" />
      {/* Shaft-to-blade joint */}
      <rect x="6" y="8" width="4" height="1" fill="#6B5210" />
      {/* Blade */}
      <rect x="5" y="9" width="6" height="2" fill="#A0A0A0" />
      <rect x="4" y="11" width="8" height="2" fill="#C0C0C0" />
      <rect x="5" y="13" width="6" height="2" fill="#A0A0A0" />
      <rect x="6" y="15" width="4" height="1" fill="#808080" />
      {/* Blade highlight */}
      <rect x="5" y="9" width="1" height="4" fill="#D0D0D0" />
      {/* Dirt on blade */}
      <rect x="9" y="12" width="2" height="1" fill="#5C4033" />
      <rect x="7" y="14" width="2" height="1" fill="#5C4033" />
    </svg>
  );
}

const DIGGING_MESSAGES = [
  "DIGGING UP DATA",
  "SNIFFING FOR DEALS",
  "HUNTING SCAMS",
  "CHECKING SOURCES",
];

function DiggingPlaceholder() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % DIGGING_MESSAGES.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div
        className="flex flex-col items-center gap-6 px-10 py-8"
        style={{
          border: "4px solid #1A1A1A",
          background: "rgba(42, 32, 20, 0.75)",
          boxShadow: "4px 4px 0 #1A1A1A",
        }}
      >
        {/* Animated shovel */}
        <div style={{ animation: "shovel-dig 1.2s ease-in-out infinite" }}>
          <PixelShovel />
        </div>

        {/* Dirt particles flying out */}
        <div className="relative -mt-4 flex gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2 w-2"
              style={{
                background: "#8B7355",
                animation: `dirt-particles 0.8s ease-out infinite`,
                animationDelay: `${i * 0.25}s`,
              }}
            />
          ))}
        </div>

        {/* Main message — cycles through phrases */}
        <div className="text-center">
          <p
            style={{
              fontFamily: PIXEL_FONT,
              fontSize: 11,
              color: "#FFD700",
              textShadow: "2px 2px 0 #1A1A1A",
              letterSpacing: 2,
            }}
          >
            {DIGGING_MESSAGES[msgIndex]}...
          </p>
        </div>

        {/* Flickering subtext */}
        <p
          style={{
            fontFamily: PIXEL_FONT,
            fontSize: 7,
            color: "#D4C4A0",
            animation: "retro-blink 1s steps(1) infinite",
          }}
        >
          Quest in progress
        </p>

        {/* Pixel progress dots */}
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-2 w-2"
              style={{
                background: "#FFD700",
                animation: "retro-blink 1.5s steps(1) infinite",
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>
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
  dogNode: DogNode,
};

export default function BoardPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("query") || "";
  const targetUrl = searchParams.get("url") || "";
  const displayLabel = query || targetUrl || "https://www.example.com";

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [threatScore, setThreatScore] = useState(0);
  const [status, setStatus] = useState<"investigating" | "complete">("investigating");
  const [summary, setSummary] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [sidebarVisible, setSidebarVisible] = useState(false);
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

  useEffect(() => {
    const heroNode: Node = {
      id: "hero",
      type: "heroCard",
      position: { x: 0, y: NODE_Y - 20 },
      data: { url: displayLabel, threatScore: 0, status: "investigating", summary: "" },
      draggable: true,
    };
    const dogNode: Node = {
      id: DOG_NODE_ID,
      type: "dogNode",
      position: getDogPosition("hero", 0),
      data: { isMoving: false },
      draggable: false,
      selectable: false,
      connectable: false,
      zIndex: 1000,
    };
    setNodes([heroNode, dogNode]);
  }, [displayLabel, setNodes]);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    if (!query && !targetUrl) return;

    const store = useResultsStore.getState();
    store.reset();

    const abortController = new AbortController();

    async function runRealSearch() {
      try {
        const body: Record<string, string> = {};
        if (query) body.query = query;
        else if (targetUrl) body.url = targetUrl;

        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: abortController.signal,
        });

        if (!res.ok || !res.body) {
          addLog("Error: Search failed");
          setStatus("complete");
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const parsed = JSON.parse(line.slice(6));
              handleSSEEvent(parsed.event, parsed.data);
            } catch { /* skip unparseable */ }
          }
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          addLog("Connection lost");
          setStatus("complete");
        }
      }
    }

    function handleSSEEvent(event: string, data: any) {
      const store = useResultsStore.getState();

      switch (event) {
        case "narration":
          addLog(data.text);
          break;

        case "product": {
          const product = data as ProductResult;
          store.addProduct(product);

          const currentIndex = cardCountRef.current;
          const pos = getLinearPosition(currentIndex);
          cardCountRef.current++;
          addLog(`Found: $${product.price} at ${product.retailer}`);

          // Move dog to new card
          const dogPos = getDogPosition(product.id, currentIndex);
          setNodes((prev) =>
            prev.map((n) =>
              n.id === DOG_NODE_ID
                ? { ...n, position: dogPos, data: { isMoving: true } }
                : n
            )
          );
          setTimeout(() => {
            setNodes((prev) =>
              prev.map((n) =>
                n.id === DOG_NODE_ID ? { ...n, data: { isMoving: false } } : n
              )
            );
          }, 800);

          // Create evidence card node for this product
          const card: EvidenceCard = {
            id: product.id,
            type: "price",
            severity: "info",
            title: `$${product.price.toFixed(2)} — ${product.retailer}`,
            detail: product.title.slice(0, 100),
            source: product.domain,
            confidence: 0.5,
            connections: [],
            metadata: {},
          };

          const newNode: Node = {
            id: product.id,
            type: "evidenceCard",
            position: pos,
            data: { ...card, isNew: true },
          };
          setNodes((prev) => [...prev, newNode]);

          const sourceId = prevCardIdRef.current;
          setEdges((prev) => [
            ...prev,
            {
              id: `${sourceId}-${product.id}`,
              source: sourceId,
              target: product.id,
              type: "straight",
              animated: true,
              style: { stroke: "#1A1A1A", strokeWidth: 3 },
            },
          ]);
          prevCardIdRef.current = product.id;

          setTimeout(() => {
            setNodes((prev) =>
              prev.map((n) =>
                n.id === product.id ? { ...n, data: { ...n.data, isNew: false } } : n
              )
            );
          }, 2500);
          break;
        }

        case "fraud_check": {
          const { productId, check } = data;
          store.addFraudCheck(productId, check);
          addLog(`${check.name}: ${check.status} — ${productId.slice(0, 8)}`);

          // Update node severity based on check results
          if (check.status === "failed") {
            setNodes((prev) =>
              prev.map((n) =>
                n.id === productId
                  ? { ...n, data: { ...n.data, severity: "critical" as CardSeverity } }
                  : n
              )
            );
          }
          break;
        }

        case "verdict": {
          const { productId, verdict, trustScore: ts } = data;
          store.setVerdict(productId, verdict, ts);
          addLog(`Verdict: ${verdict.toUpperCase()} (${ts}/100) — ${productId.slice(0, 8)}`);

          // Color the node based on verdict
          const sev: CardSeverity = verdict === "trusted" ? "safe" : verdict === "danger" ? "critical" : "warning";
          setNodes((prev) =>
            prev.map((n) =>
              n.id === productId
                ? { ...n, data: { ...n.data, severity: sev, confidence: ts / 100 } }
                : n
            )
          );
          break;
        }

        case "all_products":
          addLog(`${data.count} products found. Running security checks...`);
          break;

        case "best_pick":
          store.setBestPick(data.productId);
          addLog("Best deal identified!");
          break;

        case "done": {
          store.setDoneSummary(data.summary);
          store.setPhase("two-columns");
          setStatus("complete");
          setSummary(data.summary);
          addLog("Quest complete!");
          setNodes((prev) =>
            prev.map((n) =>
              n.id === "hero"
                ? { ...n, data: { ...n.data, status: "complete", summary: data.summary, threatScore: 0 } }
                : n
            )
          );
          break;
        }

        case "error":
          addLog(`!! ERROR: ${data.message}`);
          setStatus("complete");
          break;
      }
    }

    runRealSearch();
    return () => { abortController.abort(); };
  }, [query, targetUrl, setNodes, setEdges]);

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
            {displayLabel}
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

          {/* ── Results section — underground dirt zone ── */}
          <div ref={resultsRef} className="dirt-underground min-h-[50vh]">
            <div className="relative z-10">
              <AnimatePresence mode="wait">
                {status === "investigating" ? (
                  <motion.div
                    key="digging"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
                  >
                    <DiggingPlaceholder />
                  </motion.div>
                ) : (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <ResultsContainer />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
