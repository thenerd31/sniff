"use client";

import type { FraudCheck, FraudCheckStatus, ProductWithVerdict } from "@/types";

const PIXEL_FONT = "'Press Start 2P', monospace";

interface CardBackProps {
  product: ProductWithVerdict;
}

function getStatusPixel(status: FraudCheckStatus): { color: string; char: string } {
  switch (status) {
    case "passed":
      return { color: "#00CC00", char: "✓" };
    case "warning":
      return { color: "#FFD700", char: "!" };
    case "failed":
      return { color: "#FF0000", char: "✗" };
    case "pending":
      return { color: "#8B6914", char: "?" };
  }
}

function getSeverityBarColor(severity: number): string {
  if (severity < 0.3) return "#00CC00";
  if (severity <= 0.6) return "#FFD700";
  return "#FF0000";
}

function PixelSeverityBar({ severity }: { severity: number }) {
  const segments = 8;
  const filled = Math.round(severity * segments);
  const color = getSeverityBarColor(severity);

  return (
    <div
      className="flex gap-[1px]"
      style={{ height: 6, border: "2px solid #1A1A1A", padding: 1, background: "#2A2A2A" }}
    >
      {Array.from({ length: segments }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            background: i < filled ? color : "#444",
          }}
        />
      ))}
    </div>
  );
}

function FraudCheckRow({ check }: { check: FraudCheck }) {
  const statusInfo = getStatusPixel(check.status);

  return (
    <div className="py-1.5" style={{ borderBottom: "2px solid #1A1A1A20" }}>
      <div className="flex items-center gap-2 mb-0.5">
        <span
          style={{
            fontFamily: PIXEL_FONT,
            fontSize: 8,
            color: statusInfo.color,
            width: 12,
            textAlign: "center",
          }}
        >
          {statusInfo.char}
        </span>
        <span style={{ fontFamily: PIXEL_FONT, fontSize: 6, color: "#1A1A1A", flex: 1 }}>
          {check.name}
        </span>
      </div>
      <p className="mb-1 ml-[20px]" style={{ fontFamily: PIXEL_FONT, fontSize: 5, lineHeight: 1.8, color: "#4A3A2A" }}>
        {check.detail}
      </p>
      <div className="ml-[20px]">
        <PixelSeverityBar severity={check.severity} />
      </div>
    </div>
  );
}

export function CardBack({ product }: CardBackProps) {
  const verdictColor =
    product.verdict === "trusted" ? "#006400"
    : product.verdict === "caution" ? "#8B6914"
    : "#8B0000";

  return (
    <div
      className="w-full h-full flex flex-col p-4"
      style={{
        border: "4px solid #1A1A1A",
        borderRadius: 0,
        background: "#FFF8E8",
        boxShadow: "4px 4px 0 #1A1A1A",
        imageRendering: "pixelated",
      }}
    >
      {/* Inner border */}
      <div
        style={{
          position: "absolute",
          inset: 3,
          border: "2px solid #1A1A1A20",
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <div
        className="flex items-center gap-2 mb-2 pb-2"
        style={{ borderBottom: "3px solid #1A1A1A", position: "relative", zIndex: 1 }}
      >
        {/* Pixel shield icon */}
        <svg width="14" height="14" viewBox="0 0 8 8" style={{ imageRendering: "pixelated", flexShrink: 0 }}>
          <rect x="2" y="0" width="4" height="1" fill={verdictColor} />
          <rect x="1" y="1" width="6" height="1" fill={verdictColor} />
          <rect x="1" y="2" width="6" height="1" fill={verdictColor} />
          <rect x="1" y="3" width="6" height="1" fill={verdictColor} />
          <rect x="2" y="4" width="4" height="1" fill={verdictColor} />
          <rect x="2" y="5" width="4" height="1" fill={verdictColor} />
          <rect x="3" y="6" width="2" height="1" fill={verdictColor} />
        </svg>
        <span style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: "#1A1A1A" }}>
          SCAN LOG
        </span>
        <span
          className="ml-auto"
          style={{
            fontFamily: PIXEL_FONT,
            fontSize: 10,
            color: verdictColor,
          }}
        >
          {product.trustScore}
        </span>
      </div>

      {/* Fraud checks */}
      <div className="flex-1 overflow-y-auto" style={{ position: "relative", zIndex: 1 }}>
        {product.checks.length > 0 ? (
          product.checks.map((check, i) => (
            <FraudCheckRow key={`${check.name}-${i}`} check={check} />
          ))
        ) : (
          <p className="text-center py-4" style={{ fontFamily: PIXEL_FONT, fontSize: 6, color: "#8B6914" }}>
            NO DATA FOUND
          </p>
        )}
      </div>

      {/* Domain footer */}
      <div className="mt-2 pt-2" style={{ borderTop: "2px solid #1A1A1A40", position: "relative", zIndex: 1 }}>
        <p className="text-center" style={{ fontFamily: PIXEL_FONT, fontSize: 5, color: "#8B6914" }}>
          {product.domain}
        </p>
      </div>
    </div>
  );
}
