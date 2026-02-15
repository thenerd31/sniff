"use client";

import type { DashboardStats, DashboardSortOrder } from "@/types/dashboard";

interface DashboardHeaderProps {
  stats: DashboardStats;
  sortOrder: DashboardSortOrder;
  onSortChange: (order: DashboardSortOrder) => void;
}

const PIXEL_FONT = "'Press Start 2P', monospace";

function getAvgScoreColor(score: number): string {
  if (score >= 70) return "#00CC00";
  if (score >= 40) return "#FFD700";
  return "#FF4444";
}

const SORT_OPTIONS: { label: string; value: DashboardSortOrder }[] = [
  { label: "NEWEST", value: "newest" },
  { label: "OLDEST", value: "oldest" },
  { label: "SCORE ↓", value: "score-high" },
  { label: "SCORE ↑", value: "score-low" },
  { label: "PRICE ↓", value: "price-low" },
  { label: "PRICE ↑", value: "price-high" },
];

export function DashboardHeader({
  stats,
  sortOrder,
  onSortChange,
}: DashboardHeaderProps) {
  return (
    <div
      className="w-full mb-8"
      style={{ animation: "dashboard-card-enter 0.35s ease-out both" }}
    >
      <div className="dash-pixel-frame p-7">
        {/* ── Top row: Title + Verdict pills + Avg score ──────────── */}
        <div className="flex flex-wrap items-center gap-5 mb-5">
          {/* Title + count */}
          <div className="flex items-center gap-4">
            <span
              style={{
                fontFamily: PIXEL_FONT,
                fontSize: 14,
                color: "#1A1A1A",
              }}
            >
              SAVED ITEMS
            </span>
            <span
              className="px-3 py-2"
              style={{
                fontFamily: PIXEL_FONT,
                fontSize: 12,
                color: "#FFF8E8",
                background: "#8B6914",
                border: "3px solid #1A1A1A",
                animation: "stat-bounce 0.4s ease-out both",
              }}
            >
              {stats.totalSaved}
            </span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Verdict count pills */}
          <div className="flex items-center gap-3">
            {stats.trustedCount > 0 && (
              <span
                className="px-3 py-2"
                style={{
                  fontFamily: PIXEL_FONT,
                  fontSize: 9,
                  color: "#1A1A1A",
                  background: "#00CC00",
                  border: "3px solid #1A1A1A",
                  fontWeight: "bold",
                  animation: "stat-bounce 0.4s ease-out 0.1s both",
                }}
              >
                TRUSTED: {stats.trustedCount}
              </span>
            )}
            {stats.cautionCount > 0 && (
              <span
                className="px-3 py-2"
                style={{
                  fontFamily: PIXEL_FONT,
                  fontSize: 9,
                  color: "#1A1A1A",
                  background: "#FFD700",
                  border: "3px solid #1A1A1A",
                  fontWeight: "bold",
                  animation: "stat-bounce 0.4s ease-out 0.2s both",
                }}
              >
                CAUTION: {stats.cautionCount}
              </span>
            )}
            {stats.dangerCount > 0 && (
              <span
                className="px-3 py-2"
                style={{
                  fontFamily: PIXEL_FONT,
                  fontSize: 9,
                  color: "#FFFFFF",
                  background: "#FF0000",
                  border: "3px solid #1A1A1A",
                  fontWeight: "bold",
                  animation: "stat-bounce 0.4s ease-out 0.3s both",
                }}
              >
                DANGER: {stats.dangerCount}
              </span>
            )}
          </div>

          {/* Average score */}
          <div
            className="flex items-center gap-3"
            style={{ animation: "stat-bounce 0.4s ease-out 0.4s both" }}
          >
            <span
              style={{
                fontFamily: PIXEL_FONT,
                fontSize: 9,
                color: "#6B7280",
              }}
            >
              AVG:
            </span>
            <span
              style={{
                fontFamily: PIXEL_FONT,
                fontSize: 16,
                color: getAvgScoreColor(stats.averageTrustScore),
                fontWeight: "bold",
              }}
            >
              {stats.averageTrustScore}
            </span>
          </div>
        </div>

        {/* ── Divider ─────────────────────────────────────────────── */}
        <div
          className="w-full mb-5"
          style={{
            height: 3,
            background:
              "repeating-linear-gradient(90deg, #1A1A1A 0px, #1A1A1A 4px, transparent 4px, transparent 8px)",
          }}
        />

        {/* ── Sort controls ───────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          <span
            style={{
              fontFamily: PIXEL_FONT,
              fontSize: 9,
              color: "#8B6914",
              marginRight: 6,
            }}
          >
            SORT:
          </span>
          {SORT_OPTIONS.map((opt, i) => (
            <button
              key={opt.value}
              onClick={() => onSortChange(opt.value)}
              className={`dashboard-pixel-btn px-4 py-3 ${sortOrder === opt.value ? "selected" : ""}`}
              style={{
                fontFamily: PIXEL_FONT,
                fontSize: 8,
                fontWeight: "bold",
                animation: `stat-bounce 0.3s ease-out ${0.05 * i}s both`,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
