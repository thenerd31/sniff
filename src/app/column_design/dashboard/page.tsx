"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, ArrowLeft, Menu, X } from "lucide-react";
import { SavedDashboard } from "@/components/dashboard/SavedDashboard";
import { useSavedDashboardStore } from "@/stores/savedDashboardStore";
import "./dashboard.css";

const PIXEL_FONT = "'Press Start 2P', monospace";

// IDs from the old mock seed — purge them once so stale localStorage is cleaned
const MOCK_IDS = ["p1", "p3", "p4", "p6", "p7"];

// ── Page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  // One-time cleanup of old mock data from localStorage
  useEffect(() => {
    const purged = localStorage.getItem("sniff-mock-purged");
    if (!purged) {
      const store = useSavedDashboardStore.getState();
      for (const id of MOCK_IDS) {
        if (store.savedProducts[id]) {
          store.removeProduct(id);
        }
      }
      localStorage.setItem("sniff-mock-purged", "1");
    }
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background:
          "linear-gradient(180deg, #87CEEB 0%, #B0E0FF 40%, #C8E6B0 65%, #98D982 70%, #5EAA42 85%, #4A8C34 100%)",
      }}
    >
      {/* ── Pixel navbar — matches landing & board pages ────────── */}
      <nav
        className="sticky top-0 z-50 w-full"
        style={{
          borderBottom: "4px solid #1A1A1A",
          background: "#8B6914",
          boxShadow: "0 4px 0 #6B5210",
        }}
      >
        <div className="mx-auto flex items-center justify-between px-5 py-2.5 md:px-10">
          {/* Left: back + branding */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              aria-label="Go back"
              style={{ color: "#FFF8E8" }}
              className="cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <a href="/" className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 items-center justify-center"
                style={{ border: "2px solid #1A1A1A", background: "#FFD700" }}
              >
                <ShoppingBag className="h-3.5 w-3.5" style={{ color: "#1A1A1A" }} />
              </div>
              <span style={{ fontFamily: PIXEL_FONT, fontSize: 10, color: "#FFF8E8" }}>Sniff</span>
            </a>
          </div>

          {/* Center: page title */}
          <div className="hidden md:flex items-center gap-3">
            <div className="mx-1 h-5 w-[3px]" style={{ background: "#6B5210" }} />
            <span style={{ fontFamily: PIXEL_FONT, fontSize: 9, color: "#FFD700" }}>
              SAVED ITEMS
            </span>
            <div className="mx-1 h-5 w-[3px]" style={{ background: "#6B5210" }} />
          </div>

          {/* Right: nav links */}
          <div className="hidden items-center gap-6 md:flex">
            <a
              href="/"
              style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: "#FFF8E8", letterSpacing: 1 }}
              className="transition-colors hover:text-[#FFD700]"
            >
              HOME
            </a>
            <a
              href="/#search"
              className="pixel-btn flex items-center gap-2 px-5 py-2"
              style={{
                border: "3px solid #1A1A1A",
                background: "#FF6B00",
                fontFamily: PIXEL_FONT,
                fontSize: 7,
                color: "#FFF8E8",
              }}
            >
              NEW QUEST
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden cursor-pointer"
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
            <span style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: "#FFD700" }}>SAVED ITEMS</span>
            <a href="/" style={{ fontFamily: PIXEL_FONT, fontSize: 7, color: "#FFF8E8" }}>HOME</a>
            <a
              href="/#search"
              className="pixel-btn flex w-fit items-center px-5 py-2"
              style={{ border: "3px solid #1A1A1A", background: "#FF6B00", fontFamily: PIXEL_FONT, fontSize: 7, color: "#FFF8E8" }}
            >
              NEW QUEST
            </a>
          </div>
        )}
      </nav>

      {/* ── Main content ──────────────────────────────────────────── */}
      <div className="flex-1 py-8">
        <SavedDashboard />
      </div>

      {/* ── Grass / dirt divider ──────────────────────────────────── */}
      <div className="shrink-0">
        <div
          className="h-[4px] w-full"
          style={{ background: "#1A1A1A" }}
        />
        <div
          className="h-6 w-full"
          style={{
            background:
              "repeating-linear-gradient(90deg, #4A8C34 0px, #4A8C34 8px, #5EAA42 8px, #5EAA42 16px)",
            imageRendering: "pixelated",
          }}
        />
        <div
          className="h-8 w-full"
          style={{
            background: "linear-gradient(to bottom, #8B7355, #C4A46C)",
          }}
        />
      </div>
    </div>
  );
}
