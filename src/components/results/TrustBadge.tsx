"use client";

import { motion } from "framer-motion";
import type { ProductVerdict } from "@/types";

const PIXEL_FONT = "'Press Start 2P', monospace";

interface TrustBadgeProps {
  verdict: ProductVerdict;
  score: number;
  size?: "sm" | "md";
}

/* Inline pixel-art heart SVG */
function PixelHeart({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 8 8" style={{ imageRendering: "pixelated" }}>
      <rect x="1" y="0" width="2" height="1" fill={color} />
      <rect x="5" y="0" width="2" height="1" fill={color} />
      <rect x="0" y="1" width="4" height="1" fill={color} />
      <rect x="4" y="1" width="4" height="1" fill={color} />
      <rect x="0" y="2" width="8" height="1" fill={color} />
      <rect x="0" y="3" width="8" height="1" fill={color} />
      <rect x="1" y="4" width="6" height="1" fill={color} />
      <rect x="2" y="5" width="4" height="1" fill={color} />
      <rect x="3" y="6" width="2" height="1" fill={color} />
    </svg>
  );
}

/* Inline pixel-art skull SVG */
function PixelSkull() {
  return (
    <svg width="12" height="12" viewBox="0 0 8 8" style={{ imageRendering: "pixelated" }}>
      <rect x="2" y="0" width="4" height="1" fill="#1A1A1A" />
      <rect x="1" y="1" width="6" height="1" fill="#F5F5F5" />
      <rect x="1" y="2" width="6" height="1" fill="#F5F5F5" />
      <rect x="1" y="3" width="2" height="1" fill="#1A1A1A" />
      <rect x="5" y="3" width="2" height="1" fill="#1A1A1A" />
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

/* Inline pixel-art shield SVG */
function PixelShield() {
  return (
    <svg width="12" height="12" viewBox="0 0 8 8" style={{ imageRendering: "pixelated" }}>
      <rect x="2" y="0" width="4" height="1" fill="#FFD700" />
      <rect x="1" y="1" width="6" height="1" fill="#FFD700" />
      <rect x="1" y="2" width="6" height="1" fill="#FFD700" />
      <rect x="1" y="3" width="6" height="1" fill="#FFD700" />
      <rect x="2" y="4" width="4" height="1" fill="#FFD700" />
      <rect x="2" y="5" width="4" height="1" fill="#FFD700" />
      <rect x="3" y="6" width="2" height="1" fill="#FFD700" />
      {/* Checkmark */}
      <rect x="2" y="3" width="1" height="1" fill="#006400" />
      <rect x="3" y="4" width="1" height="1" fill="#006400" />
      <rect x="4" y="3" width="1" height="1" fill="#006400" />
      <rect x="5" y="2" width="1" height="1" fill="#006400" />
    </svg>
  );
}

const verdictConfig = {
  trusted: {
    borderColor: "#006400",
    bg: "#F0FFF0",
    textColor: "#006400",
    label: "SAFE",
    Icon: () => <PixelHeart color="#00CC00" />,
  },
  caution: {
    borderColor: "#8B6914",
    bg: "#FFFDE0",
    textColor: "#8B6914",
    label: "CAUTION",
    Icon: () => <PixelShield />,
  },
  danger: {
    borderColor: "#8B0000",
    bg: "#FFF0F0",
    textColor: "#8B0000",
    label: "DANGER",
    Icon: () => <PixelSkull />,
  },
};

export function TrustBadge({ verdict, score, size = "sm" }: TrustBadgeProps) {
  const config = verdictConfig[verdict];
  const isSmall = size === "sm";

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 25 }}
      className="inline-flex items-center gap-1.5"
      style={{
        border: `3px solid ${config.borderColor}`,
        borderRadius: 0,
        background: config.bg,
        padding: isSmall ? "2px 6px" : "4px 10px",
        fontFamily: PIXEL_FONT,
        fontSize: isSmall ? 6 : 7,
        color: config.textColor,
        imageRendering: "pixelated",
      }}
    >
      <config.Icon />
      <span>{config.label}</span>
      <span style={{ opacity: 0.7 }}>{score}</span>
    </motion.div>
  );
}
