"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";

/* ─────────────────── types ─────────────────── */
interface ParticleData {
  id: number;
  endX: number;
  endY: number;
  midX: number;
  midY: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
}

interface UnlockAnimationProps {
  unlock: boolean;
  onComplete?: () => void;
}

/* ─────────────── helpers ─────────────── */
function rand(a: number, b: number) {
  return a + Math.random() * (b - a);
}

/* ─────────────── particle config ─────────────── */
const PARTICLE_COUNT = 38;
const SPARK_COLORS = [
  "#ffd700", "#ffb347", "#f5a623", "#f7c948",
  "#e8963f", "#d4a017", "#c0c0c0", "#d8d8d8",
  "#b8b8b8", "#ffecd2",
];

function generateParticles(): ParticleData[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    // Fan upward and rightward from the right hole
    const angle = rand(-Math.PI * 0.9, -Math.PI * 0.05);
    const distance = rand(50, 170);
    const midDistance = distance * rand(0.35, 0.55);
    return {
      id: i,
      midX: Math.cos(angle) * midDistance + rand(-5, 5),
      midY: Math.sin(angle) * midDistance,
      endX: Math.cos(angle) * distance + rand(-12, 12),
      endY: Math.sin(angle) * distance + rand(35, 80), // gravity
      size: rand(1.5, 5.5),
      color: SPARK_COLORS[i % SPARK_COLORS.length],
      duration: rand(0.8, 1.5),
      delay: rand(0, 0.1),
    };
  });
}

/* ═══════════════════════════════════════════════════
   SVG GEOMETRY — Asymmetric padlock
   ═══════════════════════════════════════════════════

   The LEFT leg is LONG  — extends 28px into the body.
   The RIGHT leg is SHORT — extends only 6px into the body.

   When the shackle pops UP by 24px:
     • Left leg bottom:  100 → 76  (still 4px inside body top @ 72)
     • Right leg bottom:  78 → 54  (18px ABOVE body — visible gap!)

   Then the shackle SWINGS open, pivoting around the
   bottom of the left leg (which stays inserted).
   ═══════════════════════════════════════════════════ */

// Lock body
const BODY_X = 20;
const BODY_Y = 72;
const BODY_W = 80;
const BODY_H = 65;
const BODY_R = 10;

// Shackle
const LEFT_X = 38;
const RIGHT_X = 82;
const ARCH_APEX = 12; // top of the curve
const LEFT_LEG_BOTTOM = 100; // deep into body (28px past body top)
const RIGHT_LEG_BOTTOM = 78; // barely into body (6px past body top)

// Pop distance
const POP_Y = -24;

// Pivot: bottom of the left leg (this is the hinge pin)
const PIVOT_X = LEFT_X;
const PIVOT_Y = LEFT_LEG_BOTTOM;

/* ═══════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════ */
export default function UnlockAnimation({
  unlock,
  onComplete,
}: UnlockAnimationProps) {
  // Two separate controllers for the two nested transform groups
  const popControls = useAnimation();   // outer <g> — translateY
  const swingControls = useAnimation(); // inner <g> — rotate

  const shadowControls = useAnimation();
  const glowControls = useAnimation();

  const [phase, setPhase] = useState<
    "locked" | "tension" | "pop" | "swing" | "open"
  >("locked");
  const [showParticles, setShowParticles] = useState(false);

  const particles = useMemo(() => generateParticles(), []);

  useEffect(() => {
    if (!unlock || phase !== "locked") return;

    async function runSequence() {
      /* ─────── Phase 1: Tension / Jitter (≈500ms) ─────── */
      setPhase("tension");

      // Rapid micro-shakes via tiny Y translations — simulates
      // the lock being strained / picked
      for (let i = 0; i < 8; i++) {
        const dx = (i % 2 === 0 ? 1 : -1) * rand(0.5, 1.6);
        const dy = (i % 2 === 0 ? -1 : 1) * rand(0.3, 1.0);
        await popControls.start({
          x: dx,
          y: dy,
          transition: { duration: 0.055, ease: "easeInOut" },
        });
      }
      // Settle
      await popControls.start({
        x: 0,
        y: 0,
        transition: { duration: 0.06, ease: "easeOut" },
      });

      /* ─────── Phase 2: The Pop ─────── */
      setPhase("pop");

      // Particles burst from right hole at this exact moment
      setShowParticles(true);

      // Glow flash
      glowControls.start({
        opacity: [0, 0.8, 0.35],
        scale: [1, 1.35, 1.15],
        transition: { duration: 0.5, ease: "easeOut" },
      });

      // Spring-based pop upward — the entire shackle translates up.
      // Left leg stays partially inside, right leg clears completely.
      await popControls.start({
        y: POP_Y,
        x: 0,
        transition: {
          type: "spring",
          stiffness: 500,
          damping: 18,
          mass: 1,
        },
      });

      // Brief pause — let the eye register the gap
      await new Promise((r) => setTimeout(r, 250));

      /* ─────── Phase 3: The Swing ─────── */
      setPhase("swing");

      // Shadow shifts rightward as the shackle swings
      shadowControls.start({
        x: 18,
        opacity: 0.15,
        transition: { duration: 1, ease: "easeInOut" },
      });

      // Glow intensifies
      glowControls.start({
        opacity: 0.7,
        scale: 1.35,
        transition: { duration: 0.9, ease: "easeOut" },
      });

      // Heavy, weighted 180° rotation around the left-leg hinge
      await swingControls.start({
        rotate: -180,
        transition: {
          duration: 1.1,
          ease: [0.42, 0, 0.3, 1], // slow heavy start, smooth release
        },
      });

      // Tiny overshoot bounce
      await swingControls.start({
        rotate: -173,
        transition: { duration: 0.18, ease: "easeOut" },
      });
      await swingControls.start({
        rotate: -177,
        transition: { duration: 0.14, ease: "easeInOut" },
      });

      // Glow settles
      glowControls.start({
        opacity: 0.2,
        scale: 1.05,
        transition: { duration: 1.4, ease: "easeInOut" },
      });

      setPhase("open");
      onComplete?.();
    }

    runSequence();
  }, [unlock, phase, popControls, swingControls, shadowControls, glowControls, onComplete]);

  const isLocked = phase === "locked";

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ minWidth: 320, minHeight: 340 }}
    >
      {/* ── Ambient glow ── */}
      <motion.div
        className="pointer-events-none absolute"
        initial={{ opacity: 0, scale: 1 }}
        animate={glowControls}
        style={{
          width: 280,
          height: 280,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,215,0,0.35) 0%, rgba(245,166,35,0.15) 35%, transparent 70%)",
        }}
      />

      <svg
        width="150"
        height="210"
        viewBox="-5 -50 130 220"
        fill="none"
        style={{ overflow: "visible" }}
      >
        <defs>
          {/* Metallic body gradient — 5-stop vertical */}
          <linearGradient id="lockBodyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4a4a5a" />
            <stop offset="25%" stopColor="#3a3a48" />
            <stop offset="50%" stopColor="#2e2e3c" />
            <stop offset="75%" stopColor="#252534" />
            <stop offset="100%" stopColor="#1c1c2a" />
          </linearGradient>
          {/* Body horizontal highlight */}
          <linearGradient id="lockBodyHL" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.04)" />
          </linearGradient>
          {/* Shackle metallic gradient */}
          <linearGradient id="shackleGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#c8c8c8" />
            <stop offset="25%" stopColor="#b0b0b0" />
            <stop offset="50%" stopColor="#969696" />
            <stop offset="75%" stopColor="#808080" />
            <stop offset="100%" stopColor="#707070" />
          </linearGradient>
          {/* Shackle specular highlight */}
          <linearGradient id="shackleHL" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          {/* Keyhole */}
          <radialGradient id="keyholeGrad" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#1a1a2e" />
            <stop offset="100%" stopColor="#0d0d1a" />
          </radialGradient>
        </defs>

        {/* ── Drop shadow (shifts during swing) ── */}
        <motion.ellipse
          cx={60}
          cy={145}
          rx={38}
          ry={6}
          fill="rgba(0,0,0,0.25)"
          initial={{ x: 0, opacity: 0.2 }}
          animate={shadowControls}
        />

        {/* ════════════════════════════════════════
            SHACKLE — two nested groups:
              Outer = popControls  (translateY)
              Inner = swingControls (rotate around left-leg hinge)
            ════════════════════════════════════════ */}
        <motion.g
          animate={popControls}
          initial={{ x: 0, y: 0 }}
        >
          <motion.g
            animate={swingControls}
            initial={{ rotate: 0 }}
            style={{ transformOrigin: `${PIVOT_X}px ${PIVOT_Y}px` }}
          >
            {/* Main shackle path — ASYMMETRIC legs */}
            <path
              d={`
                M ${LEFT_X} ${LEFT_LEG_BOTTOM}
                L ${LEFT_X} ${ARCH_APEX + 26}
                C ${LEFT_X} ${ARCH_APEX + 4},
                  ${LEFT_X + 9} ${ARCH_APEX},
                  ${60} ${ARCH_APEX}
                C ${RIGHT_X - 9} ${ARCH_APEX},
                  ${RIGHT_X} ${ARCH_APEX + 4},
                  ${RIGHT_X} ${ARCH_APEX + 26}
                L ${RIGHT_X} ${RIGHT_LEG_BOTTOM}
              `}
              stroke="url(#shackleGrad)"
              strokeWidth="9"
              strokeLinecap="round"
              fill="none"
            />
            {/* Specular highlight along left side and top */}
            <path
              d={`
                M ${LEFT_X + 1} ${LEFT_LEG_BOTTOM - 6}
                L ${LEFT_X + 1} ${ARCH_APEX + 28}
                C ${LEFT_X + 1} ${ARCH_APEX + 8},
                  ${LEFT_X + 9} ${ARCH_APEX + 4},
                  ${56} ${ARCH_APEX + 4}
              `}
              stroke="url(#shackleHL)"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            {/* Right leg flat bottom cap */}
            <line
              x1={RIGHT_X - 4}
              y1={RIGHT_LEG_BOTTOM}
              x2={RIGHT_X + 4}
              y2={RIGHT_LEG_BOTTOM}
              stroke="#808080"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </motion.g>
        </motion.g>

        {/* ══════════ LOCK BODY (drawn AFTER shackle so it overlaps the legs) ══════════ */}
        <rect
          x={BODY_X}
          y={BODY_Y}
          width={BODY_W}
          height={BODY_H}
          rx={BODY_R}
          fill="url(#lockBodyGrad)"
        />
        {/* Highlight overlay */}
        <rect
          x={BODY_X}
          y={BODY_Y}
          width={BODY_W}
          height={BODY_H}
          rx={BODY_R}
          fill="url(#lockBodyHL)"
        />
        {/* Top bevel */}
        <line
          x1={BODY_X + BODY_R}
          y1={BODY_Y + 0.5}
          x2={BODY_X + BODY_W - BODY_R}
          y2={BODY_Y + 0.5}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />
        {/* Bottom edge */}
        <line
          x1={BODY_X + BODY_R}
          y1={BODY_Y + BODY_H - 0.5}
          x2={BODY_X + BODY_W - BODY_R}
          y2={BODY_Y + BODY_H - 0.5}
          stroke="rgba(0,0,0,0.3)"
          strokeWidth="1"
        />

        {/* ── Shackle holes ── */}
        <ellipse cx={LEFT_X} cy={BODY_Y + 2} rx={6.5} ry={3.5}
          fill="rgba(0,0,0,0.5)" />
        <ellipse cx={RIGHT_X} cy={BODY_Y + 2} rx={6.5} ry={3.5}
          fill="rgba(0,0,0,0.5)" />
        {/* Hole rims */}
        <ellipse cx={LEFT_X} cy={BODY_Y + 2} rx={6.5} ry={3.5}
          fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
        <ellipse cx={RIGHT_X} cy={BODY_Y + 2} rx={6.5} ry={3.5}
          fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />

        {/* ── Keyhole ── */}
        <circle cx={60} cy={99} r={7} fill="url(#keyholeGrad)" />
        <rect x={57} y={99} width={6} height={14} rx={2.5} fill="url(#keyholeGrad)" />
        <circle cx={60} cy={99} r={8.5}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />

        {/* Keyhole breathing glow (only while locked) */}
        {isLocked && (
          <motion.circle
            cx={60}
            cy={99}
            r={10}
            fill="none"
            stroke="#f5a623"
            strokeWidth="1"
            animate={{
              opacity: [0.0, 0.35, 0.0],
              r: [10, 13, 10],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}

        {/* ── Face plate screws ── */}
        {[
          [BODY_X + 10, BODY_Y + 10],
          [BODY_X + BODY_W - 10, BODY_Y + 10],
          [BODY_X + 10, BODY_Y + BODY_H - 10],
          [BODY_X + BODY_W - 10, BODY_Y + BODY_H - 10],
        ].map(([cx, cy], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r={2.5} fill="rgba(60,60,75,1)" />
            <line
              x1={(cx as number) - 1.5}
              y1={cy}
              x2={(cx as number) + 1.5}
              y2={cy}
              stroke="rgba(0,0,0,0.4)"
              strokeWidth="0.6"
            />
          </g>
        ))}
      </svg>

      {/* ── Spark particles ── */}
      <AnimatePresence>
        {showParticles &&
          particles.map((p) => (
            <motion.div
              key={p.id}
              className="pointer-events-none absolute rounded-full"
              style={{
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                boxShadow: `0 0 ${p.size * 3}px ${p.color}, 0 0 ${p.size}px rgba(255,255,255,0.3)`,
                // Right-side hole position in the rendered layout
                top: "calc(50% + 6px)",
                left: "calc(50% + 26px)",
              }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{
                x: [0, p.midX, p.endX],
                y: [0, p.midY, p.endY],
                opacity: [1, 0.85, 0],
                scale: [1.3, 0.7, 0.1],
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                ease: [0.16, 0.9, 0.4, 1], // fast burst → exponential decay
                times: [0, 0.3, 1],
              }}
              exit={{ opacity: 0 }}
            />
          ))}
      </AnimatePresence>
    </div>
  );
}
