"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  X,
  ShoppingBag,
  Search,
  ArrowRight,
  Tag,
  Sparkles,
  TrendingDown,
  Gift,
  Zap,
  Shield,
  Star,
} from "lucide-react";
import "@/styles/results.css";

const PIXEL_FONT = "'Press Start 2P', monospace";

/* ═══════════════════════════════════════════════════════════════
   PIXEL ART SPRITES
   ═══════════════════════════════════════════════════════════════ */

function PixelDogIdle({ style, className }: { style?: React.CSSProperties; className?: string }) {
  return (
    <svg
      width="115"
      height="86"
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
      {/* Nose */}
      <rect x="27" y="12" width="2" height="2" fill="#1A1A1A" />
      {/* Sniff lines */}
      <rect x="29" y="11" width="1" height="1" fill="#8B691480" />
      <rect x="30" y="10" width="1" height="1" fill="#8B691440" />
      {/* Tail — up/wagging */}
      <rect x="5" y="6" width="3" height="2" fill="#8B6914" />
      <rect x="4" y="4" width="2" height="3" fill="#8B6914" />
      <rect x="3" y="3" width="2" height="2" fill="#8B6914" />
      {/* Front legs */}
      <rect x="18" y="18" width="3" height="5" fill="#C49464" />
      <rect x="18" y="23" width="3" height="1" fill="#8B6914" />
      {/* Back legs */}
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

function PixelCoin({ delay = 0 }: { delay?: number }) {
  return (
    <div
      style={{
        animation: `float 3s ease-in-out ${delay}s infinite`,
      }}
    >
      <svg width="20" height="20" viewBox="0 0 8 8" style={{ imageRendering: "pixelated" }}>
        <rect x="2" y="0" width="4" height="1" fill="#FFD700" />
        <rect x="1" y="1" width="6" height="1" fill="#FFD700" />
        <rect x="0" y="2" width="8" height="4" fill="#FFD700" />
        <rect x="1" y="6" width="6" height="1" fill="#FFD700" />
        <rect x="2" y="7" width="4" height="1" fill="#FFD700" />
        {/* $ symbol */}
        <rect x="3" y="2" width="2" height="1" fill="#8B6914" />
        <rect x="2" y="3" width="1" height="1" fill="#8B6914" />
        <rect x="3" y="4" width="2" height="1" fill="#8B6914" />
        <rect x="5" y="5" width="1" height="1" fill="#8B6914" />
        <rect x="3" y="5" width="2" height="1" fill="#8B6914" />
      </svg>
    </div>
  );
}

function PixelSparkle({ delay = 0 }: { delay?: number }) {
  return (
    <div style={{ animation: `pixel-blink 2s steps(1) ${delay}s infinite` }}>
      <svg width="16" height="16" viewBox="0 0 8 8" style={{ imageRendering: "pixelated" }}>
        <rect x="3" y="0" width="2" height="2" fill="#FFD700" />
        <rect x="0" y="3" width="2" height="2" fill="#FFD700" />
        <rect x="6" y="3" width="2" height="2" fill="#FFD700" />
        <rect x="3" y="6" width="2" height="2" fill="#FFD700" />
        <rect x="3" y="3" width="2" height="2" fill="#FFF8E8" />
      </svg>
    </div>
  );
}

function PixelTree({ scale = 1 }: { scale?: number }) {
  const w = 48 * scale;
  const h = 72 * scale;
  return (
    <svg width={w} height={h} viewBox="0 0 16 24" style={{ imageRendering: "pixelated" }}>
      <rect x="6" y="16" width="4" height="8" fill="#8B5E3C" />
      <rect x="7" y="16" width="2" height="8" fill="#6B4226" />
      <rect x="2" y="10" width="12" height="6" fill="#3D7A2E" />
      <rect x="3" y="6" width="10" height="5" fill="#4A8C34" />
      <rect x="5" y="2" width="6" height="5" fill="#5EAA42" />
      <rect x="6" y="0" width="4" height="3" fill="#6BC850" />
      <rect x="4" y="8" width="2" height="2" fill="#5EAA42" />
      <rect x="9" y="11" width="2" height="2" fill="#4A8C34" />
      <rect x="6" y="4" width="2" height="2" fill="#6BC850" />
    </svg>
  );
}

function PixelBush({ scale = 1 }: { scale?: number }) {
  const w = 32 * scale;
  const h = 24 * scale;
  return (
    <svg width={w} height={h} viewBox="0 0 12 9" style={{ imageRendering: "pixelated" }}>
      <rect x="3" y="0" width="6" height="3" fill="#4A8C34" />
      <rect x="1" y="3" width="10" height="3" fill="#3D7A2E" />
      <rect x="0" y="6" width="12" height="3" fill="#2D6A1E" />
      <rect x="4" y="1" width="2" height="2" fill="#5EAA42" />
      <rect x="7" y="3" width="2" height="2" fill="#5EAA42" />
      <rect x="2" y="5" width="2" height="1" fill="#4A8C34" />
    </svg>
  );
}

/* Grand mountain range — spans ~70% of viewport width */
function GrandMountainRange() {
  return (
    <svg
      className="w-[75vw] max-w-[1200px]"
      viewBox="0 0 240 60"
      preserveAspectRatio="xMidYMax meet"
      style={{ imageRendering: "pixelated" }}
    >
      {/* ── Outline layer (dark pixel border) ── */}
      {/* Far-left foothill outline */}
      <polygon points="0,60 0,42 4,38 10,34 16,30 20,32 24,28 28,34 32,36 36,38 36,60" fill="#2A2040" />
      {/* Main peak outline */}
      <polygon points="30,60 36,38 44,30 52,22 60,16 68,10 76,6 84,2 88,0 92,2 100,6 106,10 112,16 118,22 124,28 130,34 136,38 140,42 140,60" fill="#2A2040" />
      {/* Right ridge outline */}
      <polygon points="130,60 136,38 142,32 150,26 158,22 164,20 170,22 176,26 182,30 188,34 194,38 200,42 200,60" fill="#2A2040" />
      {/* Far-right foothill outline */}
      <polygon points="192,60 198,40 204,36 210,32 218,30 224,32 230,36 236,40 240,44 240,60" fill="#2A2040" />

      {/* ── Fill layers (inset 2px from outline) ── */}
      {/* Far-left foothill — darkest purple */}
      <polygon points="2,60 2,43 6,39 12,35 18,31 22,33 26,30 30,35 34,37 36,60" fill="#6B5B8D" />
      {/* Main peak — muted purple gradient feel via layers */}
      <polygon points="32,60 38,39 46,31 54,23 62,17 70,11 78,7 86,3 90,1 94,3 102,7 108,11 114,17 120,23 126,29 132,35 138,39 140,60" fill="#7B6BA0" />
      {/* Main peak lighter mid-section */}
      <polygon points="50,60 56,35 64,27 72,19 80,13 88,8 92,6 96,8 104,13 110,19 116,27 122,35 128,42 128,60" fill="#8D7DB5" />
      {/* Main peak lightest upper ridge */}
      <polygon points="66,60 72,33 78,25 84,18 88,14 92,12 96,14 100,18 106,25 112,33 118,42 118,60" fill="#9E90C5" />
      {/* Right ridge */}
      <polygon points="132,60 138,39 144,33 152,27 160,23 166,21 172,23 178,27 184,31 190,35 196,39 200,60" fill="#7B6BA0" />
      <polygon points="142,60 148,37 154,31 162,27 168,25 174,27 180,31 186,37 192,42 192,60" fill="#8D7DB5" />
      {/* Far-right foothill */}
      <polygon points="194,60 200,41 206,37 212,33 220,31 226,33 232,37 238,41 240,60" fill="#6B5B8D" />

      {/* ── Snow caps on main peak ── */}
      <polygon points="82,10 86,5 90,2 92,1 94,2 98,5 102,10" fill="#E0D8F0" />
      <polygon points="85,8 88,4 90,2 92,2 96,4 99,8" fill="#F0ECF8" />
      <polygon points="88,5 90,3 92,3 96,5" fill="#FFFFFF" />

      {/* ── Snow cap on right ridge ── */}
      <polygon points="160,24 164,21 168,20 170,21 174,24" fill="#E0D8F0" />
      <polygon points="163,23 166,21 168,20 172,23" fill="#F0ECF8" />

      {/* ── Highlight edges (sunlit right sides) ── */}
      <line x1="92" y1="1" x2="138" y2="39" stroke="#B0A4D0" strokeWidth="1" />
      <line x1="170" y1="22" x2="196" y2="39" stroke="#B0A4D0" strokeWidth="1" />
    </svg>
  );
}

/* Pixel sun with glow */
function PixelSun() {
  return (
    <div className="absolute right-[6%] top-[14%]">
      {/* Glow halo */}
      <div
        className="absolute -inset-6 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255,236,130,0.35) 0%, rgba(255,200,50,0.1) 50%, transparent 70%)",
          animation: "pulse-glow 4s ease-in-out infinite",
        }}
      />
      {/* Rays */}
      <svg width="56" height="56" viewBox="0 0 14 14" style={{ imageRendering: "pixelated", position: "relative" }}>
        {/* Rays */}
        <rect x="6" y="0" width="2" height="2" fill="#FFE066" opacity="0.6" />
        <rect x="6" y="12" width="2" height="2" fill="#FFE066" opacity="0.6" />
        <rect x="0" y="6" width="2" height="2" fill="#FFE066" opacity="0.6" />
        <rect x="12" y="6" width="2" height="2" fill="#FFE066" opacity="0.6" />
        <rect x="2" y="2" width="2" height="2" fill="#FFE066" opacity="0.4" />
        <rect x="10" y="2" width="2" height="2" fill="#FFE066" opacity="0.4" />
        <rect x="2" y="10" width="2" height="2" fill="#FFE066" opacity="0.4" />
        <rect x="10" y="10" width="2" height="2" fill="#FFE066" opacity="0.4" />
        {/* Core */}
        <rect x="4" y="4" width="6" height="6" fill="#FFD700" />
        <rect x="5" y="3" width="4" height="1" fill="#FFD700" />
        <rect x="5" y="10" width="4" height="1" fill="#FFD700" />
        <rect x="3" y="5" width="1" height="4" fill="#FFD700" />
        <rect x="10" y="5" width="1" height="4" fill="#FFD700" />
        {/* Bright center */}
        <rect x="5" y="5" width="4" height="4" fill="#FFF0A0" />
        <rect x="6" y="6" width="2" height="2" fill="#FFFDE8" />
      </svg>
    </div>
  );
}

/* Pixel cloud SVGs by size */
function PixelCloudSvg({ size }: { size: "xs" | "sm" | "md" | "lg" | "xl" }) {
  const clouds: Record<string, React.ReactNode> = {
    xs: (
      <svg width="36" height="14" viewBox="0 0 9 4" style={{ imageRendering: "pixelated" }}>
        <rect x="1" y="2" width="7" height="2" fill="white" />
        <rect x="3" y="0" width="3" height="2" fill="white" />
      </svg>
    ),
    sm: (
      <svg width="48" height="20" viewBox="0 0 12 5" style={{ imageRendering: "pixelated" }}>
        <rect x="1" y="2" width="10" height="3" fill="white" />
        <rect x="3" y="0" width="4" height="2" fill="white" />
      </svg>
    ),
    md: (
      <svg width="72" height="28" viewBox="0 0 18 7" style={{ imageRendering: "pixelated" }}>
        <rect x="2" y="4" width="14" height="3" fill="white" />
        <rect x="1" y="4" width="2" height="2" fill="white" />
        <rect x="15" y="4" width="2" height="2" fill="white" />
        <rect x="5" y="2" width="4" height="2" fill="white" />
        <rect x="11" y="2" width="3" height="2" fill="white" />
      </svg>
    ),
    lg: (
      <svg width="100" height="36" viewBox="0 0 25 9" style={{ imageRendering: "pixelated" }}>
        <rect x="3" y="5" width="19" height="4" fill="white" />
        <rect x="1" y="5" width="3" height="3" fill="white" />
        <rect x="21" y="5" width="3" height="3" fill="white" />
        <rect x="6" y="3" width="5" height="2" fill="white" />
        <rect x="14" y="3" width="4" height="2" fill="white" />
        <rect x="8" y="1" width="4" height="2" fill="white" />
        <rect x="16" y="2" width="3" height="1" fill="white" />
      </svg>
    ),
    xl: (
      <svg width="140" height="44" viewBox="0 0 35 11" style={{ imageRendering: "pixelated" }}>
        <rect x="3" y="6" width="29" height="5" fill="white" />
        <rect x="1" y="7" width="3" height="3" fill="white" />
        <rect x="31" y="7" width="3" height="3" fill="white" />
        <rect x="6" y="4" width="6" height="2" fill="white" />
        <rect x="15" y="3" width="5" height="3" fill="white" />
        <rect x="24" y="4" width="5" height="2" fill="white" />
        <rect x="8" y="2" width="5" height="2" fill="white" />
        <rect x="17" y="1" width="3" height="2" fill="white" />
        <rect x="10" y="0" width="3" height="2" fill="white" />
      </svg>
    ),
  };
  return <>{clouds[size]}</>;
}

/*
 * Each cloud starts at a random horizontal offset (startPct) and drifts right.
 * Uses a negative animation-delay so it's already mid-drift on page load.
 * The wrapper is full-width; the inner element slides via cloud-scroll.
 */
function DriftingCloud({
  top,
  duration,
  startPct,
  opacity,
  size,
  zIndex = 0,
}: {
  top: string;
  duration: number;
  startPct: number; // 0-100: initial visual position as % of viewport
  opacity: number;
  size: "xs" | "sm" | "md" | "lg" | "xl";
  zIndex?: number;
}) {
  // Negative delay = animation already in progress on mount
  // startPct maps to how far through the animation cycle we are
  const negDelay = -(startPct / 100) * duration;

  return (
    <div
      className="pointer-events-none absolute left-0 w-full"
      style={{ top, zIndex }}
    >
      <div
        style={{
          opacity,
          animation: `cloud-scroll ${duration}s linear ${negDelay}s infinite`,
          willChange: "transform",
        }}
      >
        <PixelCloudSvg size={size} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SKY + GRASS BACKGROUND (hero area)
   ═══════════════════════════════════════════════════════════════ */

function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* Sky gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to bottom, #6DB8E0 0%, #87CEEB 15%, #B0E0FF 45%, #C8E6B0 80%, #98D982 87%, #5EAA42 93%, #4A8C34 100%)",
        }}
      />

      {/* Pixel sun — top-right with glow */}
      <PixelSun />

      {/* ── Back clouds (behind mountains, z-index 1) ── */}
      <DriftingCloud top="15%" duration={90}  startPct={20} opacity={0.35} size="xl" zIndex={1} />
      <DriftingCloud top="22%" duration={110} startPct={60} opacity={0.25} size="lg" zIndex={1} />

      {/* ── Grand mountain range — mid-ground (z-index 2) ── */}
      <div
        className="absolute bottom-[10%] left-1/2 opacity-50"
        style={{ transform: "translateX(-50%)", zIndex: 2 }}
      >
        <GrandMountainRange />
      </div>

      {/* ── Front clouds (in front of mountains, z-index 3) ── */}
      <DriftingCloud top="13%" duration={55} startPct={10} opacity={0.8}  size="lg" zIndex={3} />
      <DriftingCloud top="18%" duration={70} startPct={45} opacity={0.65} size="md" zIndex={3} />
      <DriftingCloud top="25%" duration={60} startPct={70} opacity={0.6}  size="xl" zIndex={3} />
      <DriftingCloud top="11%" duration={80} startPct={30} opacity={0.5}  size="sm" zIndex={3} />
      <DriftingCloud top="20%" duration={50} startPct={85} opacity={0.7}  size="xs" zIndex={3} />
      <DriftingCloud top="28%" duration={65} startPct={55} opacity={0.55} size="md" zIndex={3} />

      {/* Pixel grid overlay — behind text, in front of scene */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)`,
          backgroundSize: "16px 16px",
          imageRendering: "pixelated",
          zIndex: 4,
        }}
      />

      {/* ── Trees and bushes along bottom (z-index 5, in front of mountains) ── */}
      <div style={{ zIndex: 5 }}>
        <div className="absolute bottom-[6%] left-[1%]"><PixelTree scale={1.4} /></div>
        <div className="absolute bottom-[6%] left-[5%]"><PixelBush scale={1.1} /></div>
        <div className="absolute bottom-[6%] left-[9%]"><PixelTree scale={0.9} /></div>
        
        <div className="absolute bottom-[6%] right-[7%]"><PixelBush scale={0.8} /></div>
        <div className="absolute bottom-[6%] right-[3%]"><PixelTree scale={1.1} /></div>
        <div className="absolute bottom-[6%] right-[0%]"><PixelBush scale={0.6} /></div>
      </div>

      {/* Grass strip (z-index 6, frontmost ground layer) */}
      <div
        className="absolute bottom-0 left-0 w-full"
        style={{
          height: "10%",
          backgroundImage: "repeating-linear-gradient(90deg, #4A8C34 0px, #4A8C34 8px, #5EAA42 8px, #5EAA42 16px)",
          imageRendering: "pixelated",
          zIndex: 6,
        }}
      />
      <svg className="absolute bottom-0 left-0 w-full" height="24" style={{ imageRendering: "pixelated", zIndex: 6 }}>
        <pattern id="landing-grass" x="0" y="0" width="16" height="8" patternUnits="userSpaceOnUse">
          <rect x="2" y="0" width="2" height="4" fill="#3D7A2E" />
          <rect x="10" y="2" width="2" height="3" fill="#3D7A2E" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#landing-grass)" />
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PIXEL FRAME (shared dialogue-box container)
   ═══════════════════════════════════════════════════════════════ */

function PixelFrame({
  children,
  className,
  borderColor = "#1A1A1A",
}: {
  children: React.ReactNode;
  className?: string;
  borderColor?: string;
}) {
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
      <div
        style={{
          position: "absolute",
          inset: 3,
          border: `2px solid ${borderColor}40`,
          pointerEvents: "none",
        }}
      />
      <div className="relative" style={{ zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PIXEL SEGMENTED BAR
   ═══════════════════════════════════════════════════════════════ */

function PixelBar({ value, color, height = 10 }: { value: number; color: string; height?: number }) {
  const segments = 10;
  const filled = Math.round((value / 100) * segments);
  return (
    <div
      className="flex gap-[2px]"
      style={{ height, border: "2px solid #1A1A1A", padding: 2, background: "#2A2A2A" }}
    >
      {Array.from({ length: segments }).map((_, i) => (
        <div key={i} style={{ flex: 1, background: i < filled ? color : "#444", imageRendering: "pixelated" }} />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   NAVBAR — pixel menu
   ═══════════════════════════════════════════════════════════════ */

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      className="fixed top-0 left-0 z-50 w-full"
      style={{
        borderBottom: "4px solid #1A1A1A",
        background: "#8B6914",
        boxShadow: "0 4px 0 #6B5210",
      }}
    >
      <div className="mx-auto flex items-center justify-between px-5 py-2.5 md:px-10">
        <a href="/" className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center"
            style={{ border: "2px solid #1A1A1A", background: "#FFD700" }}
          >
            <ShoppingBag className="h-3.5 w-3.5" style={{ color: "#1A1A1A" }} />
          </div>
          <span style={{ fontFamily: PIXEL_FONT, fontSize: 10, color: "#FFF8E8" }}>Sniff</span>
        </a>

        <div className="hidden items-center gap-6 md:flex">
          <a
            href="#how-it-works"
            style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: "#FFF8E8", letterSpacing: 1 }}
            className="transition-colors hover:text-[#FFD700]"
          >
            HOW IT WORKS
          </a>
          <a
            href="#about"
            style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: "#FFF8E8", letterSpacing: 1 }}
            className="transition-colors hover:text-[#FFD700]"
          >
            ABOUT
          </a>
          <div className="mx-1 h-5 w-[3px]" style={{ background: "#6B5210" }} />
          <a
            href="#search"
            className="pixel-btn flex items-center gap-2 px-5 py-2"
            style={{
              border: "3px solid #1A1A1A",
              background: "#FF6B00",
              fontFamily: PIXEL_FONT,
              fontSize: 7,
              color: "#FFF8E8",
            }}
          >
            START QUEST
          </a>
        </div>

        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          style={{ color: "#FFF8E8" }}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div
          className="flex flex-col gap-4 px-5 pb-5 pt-3 md:hidden"
          style={{ borderTop: "3px solid #6B5210", background: "#8B6914" }}
        >
          <a href="#how-it-works" style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: "#FFF8E8" }}>HOW IT WORKS</a>
          <a href="#about" style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: "#FFF8E8" }}>ABOUT</a>
          <a
            href="#search"
            className="pixel-btn flex w-fit items-center px-5 py-2"
            style={{ border: "3px solid #1A1A1A", background: "#FF6B00", fontFamily: PIXEL_FONT, fontSize: 7, color: "#FFF8E8" }}
          >
            START QUEST
          </a>
        </div>
      )}
    </nav>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DEMO BOARD — pixel price cards
   ═══════════════════════════════════════════════════════════════ */

function DemoBoard() {
  return (
    <PixelFrame className="mx-auto w-full max-w-[900px] overflow-hidden p-0">
      <div className="relative flex h-[340px] items-center justify-center sm:h-[400px]" style={{ background: "#FFF8E8" }}>
        {/* Price cards */}
        <div
          className="absolute left-[6%] top-[14%] p-3"
          style={{
            border: "3px solid #1A1A1A",
            background: "#FFF8E8",
            boxShadow: "3px 3px 0 #1A1A1A",
            animation: "float 5s ease-in-out infinite",
          }}
        >
          <p style={{ fontFamily: PIXEL_FONT, fontSize: 6, color: "#8B6914" }}>Amazon</p>
          <p style={{ fontFamily: PIXEL_FONT, fontSize: 14, color: "#1A1A1A" }}>$39.99</p>
          <p style={{ fontFamily: PIXEL_FONT, fontSize: 6, color: "#8B6914" }}>Retail</p>
        </div>

        <div
          className="absolute right-[8%] top-[10%] p-3"
          style={{
            border: "3px solid #1A1A1A",
            background: "#FFF8E8",
            boxShadow: "3px 3px 0 #1A1A1A",
            animation: "float 5s ease-in-out 1s infinite",
          }}
        >
          <p style={{ fontFamily: PIXEL_FONT, fontSize: 6, color: "#8B6914" }}>Alibaba</p>
          <p style={{ fontFamily: PIXEL_FONT, fontSize: 14, color: "#00CC00" }}>$11.80</p>
          <p style={{ fontFamily: PIXEL_FONT, fontSize: 6, color: "#006400" }}>Best price</p>
        </div>

        <div
          className="absolute bottom-[18%] left-[28%] p-3"
          style={{
            border: "3px solid #1A1A1A",
            background: "#FFF8E8",
            boxShadow: "3px 3px 0 #1A1A1A",
            animation: "float 5s ease-in-out 2s infinite",
          }}
        >
          <p style={{ fontFamily: PIXEL_FONT, fontSize: 6, color: "#8B6914" }}>Walmart</p>
          <p style={{ fontFamily: PIXEL_FONT, fontSize: 14, color: "#1A1A1A" }}>$34.50</p>
          <p style={{ fontFamily: PIXEL_FONT, fontSize: 6, color: "#8B6914" }}>Competitor</p>
        </div>

        <div
          className="absolute bottom-[22%] right-[12%] p-3"
          style={{
            border: "3px solid #006400",
            background: "#F0FFF0",
            boxShadow: "3px 3px 0 #1A1A1A",
            animation: "float 5s ease-in-out 0.5s infinite",
          }}
        >
          <p style={{ fontFamily: PIXEL_FONT, fontSize: 6, color: "#006400" }}>YOU SAVE</p>
          <p style={{ fontFamily: PIXEL_FONT, fontSize: 14, color: "#FF6B00" }}>$28.19</p>
          <p style={{ fontFamily: PIXEL_FONT, fontSize: 6, color: "#006400" }}>70% off!</p>
        </div>

        {/* Dashed connection lines */}
        <svg className="absolute inset-0 h-full w-full" style={{ opacity: 0.2 }}>
          <line x1="22%" y1="28%" x2="72%" y2="22%" stroke="#1A1A1A" strokeWidth="3" strokeDasharray="8 6" />
          <line x1="22%" y1="34%" x2="40%" y2="68%" stroke="#1A1A1A" strokeWidth="3" strokeDasharray="8 6" />
          <line x1="75%" y1="28%" x2="75%" y2="62%" stroke="#00CC00" strokeWidth="3" strokeDasharray="8 6" />
        </svg>

        {/* Bottom savings bar */}
        <div className="absolute bottom-4 left-1/2 w-[80%] -translate-x-1/2">
          <div className="mb-2 flex items-center justify-between">
            <span style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: "#8B6914" }}>SAVINGS FOUND</span>
            <span style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: "#FF6B00", fontWeight: "bold" }}>70%</span>
          </div>
          <PixelBar value={70} color="#FF6B00" />
        </div>
      </div>
    </PixelFrame>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SAVINGS CARD — pixel dialogue box
   ═══════════════════════════════════════════════════════════════ */

function SavingsCard({
  product,
  retailer,
  retailPrice,
  sourcePrice,
  percent,
}: {
  product: string;
  retailer: string;
  retailPrice: string;
  sourcePrice: string;
  percent: number;
}) {
  return (
    <PixelFrame className="flex flex-col gap-3 p-4 transition-transform hover:-translate-y-1">
      <p style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: "#1A1A1A", lineHeight: 1.6 }}>{product}</p>
      <div className="flex items-center gap-3">
        <span style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: "#8B6914", textDecoration: "line-through" }}>{retailPrice}</span>
        <ArrowRight className="h-3 w-3" style={{ color: "#FF6B00" }} />
        <span style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: "#00CC00", fontWeight: "bold" }}>{sourcePrice}</span>
      </div>
      <div className="flex items-center justify-between">
        <span style={{ fontFamily: PIXEL_FONT, fontSize: 6, color: "#8B6914" }}>{retailer} → Source</span>
        <span
          style={{
            fontFamily: PIXEL_FONT,
            fontSize: 6,
            color: "#006400",
            border: "2px solid #006400",
            background: "#F0FFF0",
            padding: "2px 6px",
          }}
        >
          SAVE {percent}%
        </span>
      </div>
    </PixelFrame>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HERO SEARCH — pixel quest input
   ═══════════════════════════════════════════════════════════════ */

function HeroSearch() {
  const [url, setUrl] = useState("");
  const router = useRouter();

  function handleInvestigate() {
    const target = url.trim() || "https://www.amazon.com/dp/B0DEMO12345";
    router.push(`/board_test?url=${encodeURIComponent(target)}`);
  }

  return (
    <div className="flex w-full max-w-[744px] flex-col items-center gap-5">
      {/* Search bar with sparkles */}
      <div className="relative w-full">
        {/* Sparkles around search */}
        <div className="absolute -bottom-5 -left-8">
          <PixelSparkle delay={0} />
        </div>
        <div className="absolute -right-8 top-0">
          <PixelSparkle delay={0.7} />
        </div>
        <div className="absolute -bottom-4 -right-10">
          <PixelCoin delay={0.3} />
        </div>
        <div className="absolute -left-10 -top-5">
          <PixelCoin delay={1.2} />
        </div>

        <div
          className="flex w-full items-center gap-0"
          style={{
            border: "5px solid #1A1A1A",
            background: "#FFF8E8",
            boxShadow: "5px 5px 0 #1A1A1A",
            imageRendering: "pixelated",
          }}
        >
          <Search className="ml-4 h-5 w-5 shrink-0" style={{ color: "#8B6914" }} />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleInvestigate()}
            placeholder="Describe the treasure you're looking for..."
            className="h-14 flex-1 bg-transparent px-4 text-[#4A3A2A] placeholder:text-[#8B6914]/50 focus:outline-none"
            style={{ fontFamily: PIXEL_FONT, fontSize: 10, imageRendering: "pixelated" }}
          />
          <button
            onClick={handleInvestigate}
            className="m-2 flex h-11 items-center gap-2.5 px-6"
            style={{
              border: "4px solid #1A1A1A",
              background: "#FF6B00",
              fontFamily: PIXEL_FONT,
              fontSize: 8,
              color: "#FFF8E8",
              animation: "legendary-glow 2s ease-in-out infinite",
              cursor: "pointer",
              imageRendering: "pixelated",
              transform: "translateY(0)",
              transition: "transform 0.05s",
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = "translateY(3px)"; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
          >
            FIND DEALS
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <p style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: "#4A3A2A", opacity: 0.7, letterSpacing: 1, imageRendering: "pixelated" }}>
        Works with Amazon, Walmart, eBay, AliExpress &amp; more
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FEATURE CARD — pixel dialogue box with icon
   ═══════════════════════════════════════════════════════════════ */

function FeatureCard({
  icon: Icon,
  iconColor,
  title,
  description,
  children,
}: {
  icon: React.FC<{ className?: string; style?: React.CSSProperties }>;
  iconColor: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <PixelFrame className="flex min-h-[300px] flex-col p-5">
      <div className="mb-3 flex items-center gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center"
          style={{ border: "2px solid #1A1A1A", background: "#FFF8E8" }}
        >
          <Icon className="h-4 w-4" style={{ color: iconColor }} />
        </div>
        <h3 style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: "#1A1A1A", lineHeight: 1.6 }}>
          {title}
        </h3>
      </div>
      <p style={{ fontFamily: PIXEL_FONT, fontSize: 6, lineHeight: 2, color: "#4A3A2A" }} className="mb-4">
        {description}
      </p>
      <div className="mt-auto">{children}</div>
    </PixelFrame>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════ */

export default function Home() {
  return (
    <div className="relative min-h-screen" style={{ background: "#FFF8E8" }}>
      <Navbar />

      {/* ═══════════════ HERO — sky zone ═══════════════ */}
      <section id="search" className="relative overflow-hidden">
        <HeroBackground />

        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pt-24 text-center">
          <div className="mx-auto flex w-full max-w-[960px] flex-col items-center gap-8">
            {/* Announcement badge — pixel style with float */}
            <div
              className="flex items-center gap-2.5 px-5 py-2.5"
              style={{
                border: "4px solid #1A1A1A",
                background: "#FFD700",
                boxShadow: "4px 4px 0 #1A1A1A",
                animation: "float-gentle 3s ease-in-out infinite",
                imageRendering: "pixelated",
              }}
            >
              <Sparkles className="h-3.5 w-3.5" style={{ color: "#8B6914" }} />
              <span style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: "#1A1A1A", letterSpacing: 1 }}>
                NEW — AI-POWERED PRICE DISCOVERY
              </span>
            </div>

            {/* Dog + Heading */}
            <div className="flex items-center gap-5">
              <div style={{ animation: "dog-bob 1.2s ease-in-out infinite" }}>
                <PixelDogIdle />
              </div>
              <h1 className="flex flex-col items-start">
                <span style={{ fontFamily: PIXEL_FONT, fontSize: 24, color: "#FFF8E8", textShadow: "4px 4px 0 #1A1A1A, -1px -1px 0 #1A1A1A, 1px -1px 0 #1A1A1A, -1px 1px 0 #1A1A1A, 1px 1px 0 #1A1A1A", lineHeight: 2, imageRendering: "pixelated" }}>
                  YOUR PERSONAL
                </span>
                <span style={{ fontFamily: PIXEL_FONT, fontSize: 24, color: "#FF6B00", textShadow: "4px 4px 0 #1A1A1A, -1px -1px 0 #1A1A1A, 1px -1px 0 #1A1A1A, -1px 1px 0 #1A1A1A, 1px 1px 0 #1A1A1A", lineHeight: 2, imageRendering: "pixelated" }}>
                  SHOPPING QUEST
                </span>
              </h1>
            </div>

            {/* Subtitle */}
            <p
              className="max-w-[672px]"
              style={{
                fontFamily: PIXEL_FONT,
                fontSize: 10,
                lineHeight: 2.2,
                color: "#FFF8E8",
                textShadow: "2px 2px 0 #1A1A1A, -1px -1px 0 #1A1A1A, 1px -1px 0 #1A1A1A, -1px 1px 0 #1A1A1A, 1px 1px 0 #1A1A1A",
                imageRendering: "pixelated",
              }}
            >
              Paste any product link and Sniff finds the best price across every store — so you never overpay again.
            </p>

            <HeroSearch />
          </div>
        </div>
      </section>

      {/* ═══════════════ SEPARATOR: grass → parchment ═══════════════ */}
      <div className="relative z-20">
        <div className="h-[4px] w-full" style={{ background: "#1A1A1A" }} />
        <div
          className="h-3 w-full"
          style={{ background: "linear-gradient(to bottom, #4A8C34, #D4C4A0)", imageRendering: "pixelated" }}
        />
      </div>

      {/* ═══════════════ LIVE DEMO — parchment zone ═══════════════ */}
      <section className="relative z-10 px-6 py-16" style={{ background: "#D4C4A0" }}>
        <DemoBoard />
      </section>

      {/* ═══════════════ SEPARATOR ═══════════════ */}
      <div className="relative z-20">
        <div className="h-[4px] w-full" style={{ background: "#1A1A1A" }} />
      </div>

      {/* ═══════════════ FEATURES — parchment + grid ═══════════════ */}
      <section
        id="how-it-works"
        className="relative z-10 px-6 py-20"
        style={{ background: "#FFF8E8" }}
      >
        {/* Grid overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)`,
            backgroundSize: "16px 16px",
          }}
        />

        <div className="relative mx-auto max-w-[1100px]">
          {/* Section header */}
          <div className="mb-12 flex flex-col items-center text-center">
            <div
              className="mb-4 flex items-center gap-2 px-3 py-1.5"
              style={{ border: "2px solid #8B6914", background: "#FFD700" }}
            >
              <Sparkles className="h-3 w-3" style={{ color: "#8B6914" }} />
              <span style={{ fontFamily: PIXEL_FONT, fontSize: 6, color: "#8B6914", letterSpacing: 2 }}>
                ABILITIES &amp; POWERS
              </span>
            </div>
            <h2 style={{ fontFamily: PIXEL_FONT, fontSize: 14, color: "#1A1A1A", lineHeight: 2.2, textShadow: "2px 2px 0 #D4C4A0" }}>
              DISCOVER, COMPARE
            </h2>
            <h2 style={{ fontFamily: PIXEL_FONT, fontSize: 14, color: "#FF6B00", lineHeight: 2.2, textShadow: "2px 2px 0 #1A1A1A" }}>
              AND SAVE
            </h2>
            <p
              className="mt-4 max-w-[560px]"
              style={{ fontFamily: PIXEL_FONT, fontSize: 7, lineHeight: 2.2, color: "#4A3A2A" }}
            >
              From price tracking to deal alerts, Sniff is your AI companion for finding deals across the internet.
            </p>
          </div>

          {/* 2x2 feature grid */}
          <div className="grid gap-6 md:grid-cols-2">
            <FeatureCard
              icon={Tag}
              iconColor="#4444FF"
              title="SMART PRICE SCAN"
              description="Scan prices across Amazon, Walmart, AliExpress, and 50+ stores to find the lowest price instantly."
            >
              {/* Mini browser mock */}
              <div style={{ border: "3px solid #1A1A1A", background: "#FFF8E8" }}>
                <div className="flex items-center gap-1.5 px-3 py-2" style={{ borderBottom: "2px solid #1A1A1A", background: "#D4C4A0" }}>
                  <div className="h-2 w-2" style={{ background: "#FF0000", border: "1px solid #1A1A1A" }} />
                  <div className="h-2 w-2" style={{ background: "#FFD700", border: "1px solid #1A1A1A" }} />
                  <div className="h-2 w-2" style={{ background: "#00CC00", border: "1px solid #1A1A1A" }} />
                  <div className="ml-2 h-3 flex-1" style={{ background: "#FFF8E8", border: "1px solid #1A1A1A" }} />
                </div>
                <div className="flex gap-3 p-3">
                  <div className="h-14 w-14 shrink-0" style={{ border: "2px dashed #FF6B00", background: "#FFF4EC" }}>
                    <span style={{ fontFamily: PIXEL_FONT, fontSize: 5, color: "#FF6B00", padding: 2, display: "block" }}>IMG</span>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 pt-1">
                    <div className="h-2 w-3/4" style={{ background: "#D4C4A0" }} />
                    <div className="h-3 w-1/3" style={{ border: "2px dashed #FF6B00", background: "#FFF4EC" }}>
                      <span style={{ fontFamily: PIXEL_FONT, fontSize: 4, color: "#FF6B00", padding: 1, display: "block" }}>PRICE</span>
                    </div>
                    <div className="mt-auto flex items-center justify-center px-2 py-1" style={{ border: "2px solid #FF6B00", background: "#FF6B00" }}>
                      <span style={{ fontFamily: PIXEL_FONT, fontSize: 5, color: "#FFF8E8" }}>Best Deal</span>
                    </div>
                  </div>
                </div>
              </div>
            </FeatureCard>

            <FeatureCard
              icon={Zap}
              iconColor="#FFD700"
              title="DEAL DISCOVERY FLOW"
              description="Watch Sniff trace your product from retail to source, uncovering deals in real time."
            >
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { label: "SCAN", color: "#FF6B00" },
                  { label: "MATCH", color: "#4444FF" },
                  { label: "COMPARE", color: "#00CC00" },
                  { label: "ALERT", color: "#FFD700" },
                  { label: "SAVE!", color: "#FF6B00" },
                ].map((step, i, arr) => (
                  <div key={step.label} className="flex items-center gap-2">
                    <span
                      className="px-3 py-1.5"
                      style={{
                        fontFamily: PIXEL_FONT,
                        fontSize: 6,
                        color: step.label === "SAVE!" ? "#FFF8E8" : step.color,
                        border: `2px solid ${step.color}`,
                        background: step.label === "SAVE!" ? step.color : "#FFF8E8",
                      }}
                    >
                      {step.label}
                    </span>
                    {i < arr.length - 1 && (
                      <span style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: "#8B6914" }}>→</span>
                    )}
                  </div>
                ))}
              </div>
            </FeatureCard>

            <FeatureCard
              icon={TrendingDown}
              iconColor="#00CC00"
              title="CATEGORY SAVINGS"
              description="Our users save big across every category — electronics to beauty, deals are always there."
            >
              <div className="flex flex-col gap-3">
                {[
                  { label: "ELECTRONICS", pct: 74, color: "#FF6B00" },
                  { label: "HOME", pct: 82, color: "#00CC00" },
                  { label: "FASHION", pct: 68, color: "#FFD700" },
                  { label: "BEAUTY", pct: 77, color: "#4444FF" },
                ].map((bar) => (
                  <div key={bar.label} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span style={{ fontFamily: PIXEL_FONT, fontSize: 6, color: "#8B6914" }}>{bar.label}</span>
                      <span style={{ fontFamily: PIXEL_FONT, fontSize: 6, color: "#1A1A1A" }}>{bar.pct}%</span>
                    </div>
                    <PixelBar value={bar.pct} color={bar.color} height={8} />
                  </div>
                ))}
              </div>
            </FeatureCard>

            <FeatureCard
              icon={Shield}
              iconColor="#FF0000"
              title="TRUSTED SELLERS"
              description="We check reviews, shipping, and returns so you only buy from sellers you can trust."
            >
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: "ALIBABA", score: 92, trend: "+3" },
                  { name: "DHGATE", score: 78, trend: "-1" },
                  { name: "1688 SUPPLY", score: 95, trend: "+5" },
                  { name: "ALIEXPRESS", score: 88, trend: "+2" },
                ].map((v) => (
                  <div
                    key={v.name}
                    className="flex flex-col gap-1 p-2"
                    style={{ border: "2px solid #1A1A1A", background: "#FFF8E8" }}
                  >
                    <span style={{ fontFamily: PIXEL_FONT, fontSize: 5, color: "#8B6914" }}>{v.name}</span>
                    <div className="flex items-baseline gap-1">
                      <span style={{ fontFamily: PIXEL_FONT, fontSize: 10, color: "#1A1A1A" }}>{v.score}</span>
                      <span style={{ fontFamily: PIXEL_FONT, fontSize: 5, color: "#8B6914" }}>/100</span>
                      <span
                        className="ml-auto"
                        style={{
                          fontFamily: PIXEL_FONT,
                          fontSize: 6,
                          color: v.trend.startsWith("+") ? "#00CC00" : "#FF0000",
                        }}
                      >
                        {v.trend}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </FeatureCard>
          </div>
        </div>
      </section>

      {/* ═══════════════ SEPARATOR: parchment → dirt ═══════════════ */}
      <div className="relative z-20">
        <div className="h-[4px] w-full" style={{ background: "#1A1A1A" }} />
        <div
          className="h-3 w-full"
          style={{ background: "linear-gradient(to bottom, #D4C4A0, #8B7355)", imageRendering: "pixelated" }}
        />
      </div>

      {/* ═══════════════ REAL SAVINGS — dirt underground ═══════════════ */}
      <section className="dirt-underground relative z-10 px-6 py-20">
        <div className="relative z-10 mx-auto max-w-[1000px]">
          <div className="mb-12 flex flex-col items-center text-center">
            <div
              className="mb-4 flex items-center gap-2 px-3 py-1.5"
              style={{ border: "2px solid #FFD700", background: "#8B6914" }}
            >
              <Gift className="h-3 w-3" style={{ color: "#FFD700" }} />
              <span style={{ fontFamily: PIXEL_FONT, fontSize: 6, color: "#FFD700", letterSpacing: 2 }}>
                LOOT DROPS
              </span>
            </div>
            <h2 style={{ fontFamily: PIXEL_FONT, fontSize: 14, color: "#FFF8E8", lineHeight: 2.2, textShadow: "2px 2px 0 #1A1A1A" }}>
              REAL SAVINGS,
            </h2>
            <h2 style={{ fontFamily: PIXEL_FONT, fontSize: 14, color: "#FFD700", lineHeight: 2.2, textShadow: "2px 2px 0 #1A1A1A" }}>
              REAL PRODUCTS
            </h2>
            <p className="mt-4 max-w-[500px]" style={{ fontFamily: PIXEL_FONT, fontSize: 7, lineHeight: 2.2, color: "#D4C4A0" }}>
              Deals our shoppers have found using Sniff.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <SavingsCard product="LED Desk Lamp" retailer="Amazon" retailPrice="$39.99" sourcePrice="$11.80" percent={70} />
            <SavingsCard product="Wireless Earbuds" retailer="Best Buy" retailPrice="$79.00" sourcePrice="$18.50" percent={77} />
            <SavingsCard product="Yoga Mat (6mm)" retailer="Target" retailPrice="$34.99" sourcePrice="$6.20" percent={82} />
            <SavingsCard product="Phone Case (MagSafe)" retailer="Amazon" retailPrice="$29.99" sourcePrice="$3.40" percent={89} />
            <SavingsCard product="USB-C Hub 7-in-1" retailer="Walmart" retailPrice="$49.99" sourcePrice="$12.90" percent={74} />
            <SavingsCard product="Silicone Kitchen Tongs" retailer="Amazon" retailPrice="$14.99" sourcePrice="$2.10" percent={86} />
          </div>
        </div>
      </section>

      {/* ═══════════════ SEPARATOR ═══════════════ */}
      <div className="relative z-20">
        <div className="h-[4px] w-full" style={{ background: "#1A1A1A" }} />
      </div>

      {/* ═══════════════ POWERED BY — darker dirt ═══════════════ */}
      <section className="relative z-10 px-6 py-16" style={{ background: "#D4C4A0" }}>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)`,
            backgroundSize: "16px 16px",
          }}
        />
        <div className="relative mx-auto max-w-[800px] text-center">
          <p className="mb-8" style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: "#8B6914", letterSpacing: 3 }}>
            POWERED BY
          </p>
          <div className="flex flex-wrap items-center justify-center gap-10">
            {["Perplexity", "Bright Data", "OpenAI"].map((name) => (
              <div
                key={name}
                className="flex items-center gap-2 px-4 py-2 transition-transform hover:-translate-y-0.5"
                style={{ border: "3px solid #1A1A1A", background: "#FFF8E8", boxShadow: "3px 3px 0 #1A1A1A" }}
              >
                <Star className="h-3.5 w-3.5" style={{ color: "#8B6914" }} />
                <span style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: "#1A1A1A" }}>{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ SEPARATOR ═══════════════ */}
      <div className="relative z-20">
        <div className="h-[4px] w-full" style={{ background: "#1A1A1A" }} />
      </div>

      {/* ═══════════════ ABOUT ═══════════════ */}
      <section id="about" className="relative z-10 px-6 py-20" style={{ background: "#FFF8E8" }}>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)`,
            backgroundSize: "16px 16px",
          }}
        />
        <div className="relative mx-auto max-w-[640px] text-center">
          <PixelFrame className="p-8">
            <h2 className="mb-6" style={{ fontFamily: PIXEL_FONT, fontSize: 12, color: "#1A1A1A", lineHeight: 2.2, textShadow: "2px 2px 0 #D4C4A0" }}>
              BUILT AT TREEHACKS 2026
            </h2>
            <p style={{ fontFamily: PIXEL_FONT, fontSize: 7, lineHeight: 2.4, color: "#4A3A2A" }}>
              Sniff started as a question: why do we pay 5-10x markup on everyday products?
              We built an AI shopping assistant that finds the best deals across the entire
              internet — so you always get the best price.
            </p>
          </PixelFrame>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer
        className="relative z-10 px-6 py-6"
        style={{
          borderTop: "4px solid #1A1A1A",
          background: "#8B6914",
          boxShadow: "inset 0 4px 0 #6B5210",
        }}
      >
        <div className="mx-auto flex max-w-[1000px] flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <div
              className="flex h-6 w-6 items-center justify-center"
              style={{ border: "2px solid #1A1A1A", background: "#FFD700" }}
            >
              <ShoppingBag className="h-3 w-3" style={{ color: "#1A1A1A" }} />
            </div>
            <span style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: "#FFF8E8" }}>
              Sniff &copy; {new Date().getFullYear()}
            </span>
          </div>
          <div className="flex items-center gap-6">
            {["Privacy", "Terms", "GitHub"].map((label) => (
              <a
                key={label}
                href="#"
                style={{ fontFamily: PIXEL_FONT, fontSize: 6, color: "#D4C4A0" }}
                className="transition-colors hover:text-[#FFD700]"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
