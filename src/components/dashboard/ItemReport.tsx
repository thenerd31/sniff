"use client";

import type { ProductWithVerdict, FraudCheck, FraudCheckStatus } from "@/types";

const PIXEL_FONT = "'Press Start 2P', monospace";

// ── Helpers ──────────────────────────────────────────────────────────────

function getVerdictColor(verdict: string): string {
  switch (verdict) {
    case "trusted":
      return "#00CC00";
    case "caution":
      return "#FFD700";
    case "danger":
      return "#FF4444";
    default:
      return "#8B6914";
  }
}

function getSeverityClass(severity: number): string {
  if (severity < 0.3) return "severity-low";
  if (severity <= 0.6) return "severity-mid";
  return "severity-high";
}

function getStatusIndicator(status: FraudCheckStatus): {
  text: string;
  color: string;
} {
  switch (status) {
    case "passed":
      return { text: "[OK]", color: "#00CC00" };
    case "warning":
      return { text: "[!!]", color: "#FFD700" };
    case "failed":
      return { text: "[XX]", color: "#FF4444" };
    case "pending":
      return { text: "[..]", color: "#6B7280" };
  }
}

function getRecommendations(verdict: string): string[] {
  switch (verdict) {
    case "trusted":
      return [
        "This retailer appears legitimate.",
        "Standard online shopping precautions apply.",
        "Compare prices across retailers before purchasing.",
      ];
    case "caution":
      return [
        "Verify seller through independent channels.",
        "Use a payment method with buyer protection.",
        "Look for independent reviews outside the site.",
        "Save screenshots of product listings and policies.",
      ];
    case "danger":
      return [
        "Do NOT proceed with any transactions on this site.",
        "Do not enter personal or payment information.",
        "Report this site to reportfraud.ftc.gov.",
        "Check for the same product from established retailers.",
      ];
    default:
      return [];
  }
}

// ── Fraud Check Row ──────────────────────────────────────────────────────

function FraudCheckRow({
  check,
  index,
}: {
  check: FraudCheck;
  index: number;
}) {
  const indicator = getStatusIndicator(check.status);

  return (
    <div
      className="dash-pixel-frame p-5"
      style={{
        animation: `check-row-enter 0.3s ease-out ${index * 0.1}s both`,
        boxShadow: "2px 2px 0 #8B6914",
      }}
    >
      {/* Header row */}
      <div className="flex items-center gap-3 mb-3">
        <span
          style={{
            fontFamily: PIXEL_FONT,
            fontSize: 11,
            color: indicator.color,
            letterSpacing: 1,
          }}
        >
          {indicator.text}
        </span>
        <span
          style={{
            fontFamily: PIXEL_FONT,
            fontSize: 9,
            color: "#1A1A1A",
          }}
        >
          {check.name}
        </span>
      </div>

      {/* Detail text */}
      <p
        className="mb-4"
        style={{
          fontFamily: PIXEL_FONT,
          fontSize: 8,
          color: "#4A3A2A",
          lineHeight: 2.2,
        }}
      >
        {check.detail}
      </p>

      {/* Severity bar */}
      <div className="pixel-severity-bar" style={{ height: 10 }}>
        <div
          className={`pixel-severity-fill ${getSeverityClass(check.severity)}`}
          style={{ width: `${check.severity * 100}%` }}
        />
      </div>
    </div>
  );
}

// ── Main Report ──────────────────────────────────────────────────────────

interface ItemReportProps {
  product: ProductWithVerdict;
  savedAt: string;
}

export function ItemReport({ product, savedAt }: ItemReportProps) {
  const verdictColor = getVerdictColor(product.verdict);
  const recommendations = getRecommendations(product.verdict);
  const filledSegments = Math.round(product.trustScore / 10);

  const formattedDate = new Date(savedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div style={{ animation: "dashboard-report-expand 0.35s ease-out both" }}>
      {/* ── Trust Score Header ────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-4 mb-8">
        <div
          style={{
            fontFamily: PIXEL_FONT,
            fontSize: 36,
            color: verdictColor,
            animation: "score-pulse 2s ease-in-out infinite",
          }}
        >
          {product.trustScore}
        </div>
        <span
          style={{
            fontFamily: PIXEL_FONT,
            fontSize: 12,
            color: verdictColor,
          }}
        >
          {product.verdict.toUpperCase()}
        </span>

        {/* Segmented score bar */}
        <div className="flex gap-1.5 w-full max-w-sm">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className={`score-segment ${i < filledSegments ? `filled verdict-${product.verdict}` : ""}`}
              style={{
                height: 14,
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
        </div>

        <span
          style={{
            fontFamily: PIXEL_FONT,
            fontSize: 8,
            color: "#6B7280",
          }}
        >
          TRUST SCORE: {product.trustScore}/100
        </span>
      </div>

      {/* ── Divider ───────────────────────────────────────────────── */}
      <div
        className="w-full my-5"
        style={{
          height: 3,
          background:
            "repeating-linear-gradient(90deg, #1A1A1A 0px, #1A1A1A 4px, transparent 4px, transparent 8px)",
        }}
      />

      {/* ── Fraud Checks ──────────────────────────────────────────── */}
      <div className="mb-8">
        <h3
          className="mb-5"
          style={{
            fontFamily: PIXEL_FONT,
            fontSize: 11,
            color: "#8B6914",
          }}
        >
          FRAUD ANALYSIS
        </h3>
        <div className="flex flex-col gap-4">
          {product.checks.map((check, i) => (
            <FraudCheckRow
              key={`${check.name}-${i}`}
              check={check}
              index={i}
            />
          ))}
          {product.checks.length === 0 && (
            <p
              style={{
                fontFamily: PIXEL_FONT,
                fontSize: 9,
                color: "#6B7280",
                textAlign: "center",
              }}
            >
              No fraud checks available
            </p>
          )}
        </div>
      </div>

      {/* ── Divider ───────────────────────────────────────────────── */}
      <div
        className="w-full my-5"
        style={{
          height: 3,
          background:
            "repeating-linear-gradient(90deg, #1A1A1A 0px, #1A1A1A 4px, transparent 4px, transparent 8px)",
        }}
      />

      {/* ── Recommendations ───────────────────────────────────────── */}
      <div className="mb-8">
        <h3
          className="mb-5"
          style={{
            fontFamily: PIXEL_FONT,
            fontSize: 11,
            color: "#8B6914",
          }}
        >
          RECOMMENDATIONS
        </h3>
        <div className="flex flex-col gap-3">
          {recommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-3">
              <div
                className="mt-1.5 shrink-0"
                style={{
                  width: 8,
                  height: 8,
                  background: "#FFD700",
                  border: "2px solid #1A1A1A",
                }}
              />
              <p
                style={{
                  fontFamily: PIXEL_FONT,
                  fontSize: 8,
                  color: "#4A3A2A",
                  lineHeight: 2.2,
                }}
              >
                {rec}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Metadata Footer ───────────────────────────────────────── */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 pt-4"
        style={{ borderTop: "3px solid #D4C4A0" }}
      >
        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: PIXEL_FONT,
            fontSize: 8,
            color: "#FF6B00",
            textDecoration: "none",
          }}
        >
          {product.domain}
        </a>
        <span
          style={{
            fontFamily: PIXEL_FONT,
            fontSize: 8,
            color: "#6B7280",
          }}
        >
          Saved: {formattedDate}
        </span>
      </div>
    </div>
  );
}
