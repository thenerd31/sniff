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
    const angle = rand(-Math.PI * 0.9, -Math.PI * 0.05);
    const distance = rand(50, 170);
    const midDistance = distance * rand(0.35, 0.55);
    return {
      id: i,
      midX: Math.cos(angle) * midDistance + rand(-5, 5),
      midY: Math.sin(angle) * midDistance,
      endX: Math.cos(angle) * distance + rand(-12, 12),
      endY: Math.sin(angle) * distance + rand(35, 80),
      size: rand(1.5, 5.5),
      color: SPARK_COLORS[i % SPARK_COLORS.length],
      duration: rand(0.8, 1.5),
      delay: rand(0, 0.1),
    };
  });
}

/* ═══════════════════════════════════════════════════
   SVG GEOMETRY — Asymmetric padlock

   LEFT leg  = LONG  (28px into body) — the hinge pin
   RIGHT leg = SHORT (6px into body)  — clears on pop

   Pop = 24px up:
     Left  100 → 76 (still 4px inside body top @72)
     Right  78 → 54 (18px above body — visible gap)

   Swing = rotateY -160° around the left leg
           (horizontal swing outward like a real padlock hinge)
   ═══════════════════════════════════════════════════ */

const BODY_X = 20;
const BODY_Y = 72;
const BODY_W = 80;
const BODY_H = 65;
const BODY_R = 10;

const LEFT_X = 38;
const RIGHT_X = 82;
const ARCH_APEX = 12;
const LEFT_LEG_BOTTOM = 100;
const RIGHT_LEG_BOTTOM = 78;

// The shackle starts at CLOSED_Y (pushed into the body).
// The pop lifts it to POPPED_Y (right leg clears the body).
const CLOSED_Y = 24;
const POPPED_Y = 0;

// Pixel positions of the left leg in the shackle's rendered HTML div.
// Shackle SVG viewBox="-5 -10 130 120" rendered at 150×130px.
//   scaleX = 150/130 ≈ 1.1538   scaleY = 130/120 ≈ 1.0833
//   LEFT_X (38) → (38-(-5)) × 1.1538 ≈ 50px
//   LEFT_LEG_BOTTOM (100) → (100-(-10)) × 1.0833 ≈ 119px
const PIVOT_PX_X = 50;
const PIVOT_PX_Y = 119;

/* ═══════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════ */
export default function UnlockAnimation({
  unlock,
  onComplete,
}: UnlockAnimationProps) {
  const popControls = useAnimation();
  const swingControls = useAnimation();
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
      /* ─────── Phase 1: Tension / Jitter ─────── */
      setPhase("tension");

      for (let i = 0; i < 8; i++) {
        const dx = (i % 2 === 0 ? 1 : -1) * rand(0.5, 1.6);
        const dy = CLOSED_Y + (i % 2 === 0 ? -1 : 1) * rand(0.3, 1.0);
        await popControls.start({
          x: dx,
          y: dy,
          transition: { duration: 0.055, ease: "easeInOut" },
        });
      }
      // Settle back to closed position
      await popControls.start({
        x: 0,
        y: CLOSED_Y,
        transition: { duration: 0.06, ease: "easeOut" },
      });

      /* ─────── Phase 2: The Pop ─────── */
      setPhase("pop");

      setShowParticles(true);

      glowControls.start({
        opacity: [0, 0.8, 0.35],
        scale: [1, 1.35, 1.15],
        transition: { duration: 0.5, ease: "easeOut" },
      });

      // Spring pop — lifts shackle from CLOSED_Y to POPPED_Y.
      // Right leg clears body, left leg stays partially inside.
      await popControls.start({
        y: POPPED_Y,
        x: 0,
        transition: {
          type: "spring",
          stiffness: 500,
          damping: 18,
          mass: 1,
        },
      });

      await new Promise((r) => setTimeout(r, 250));

      /* ─────── Phase 3: The Swing (Y-axis — horizontal) ─────── */
      setPhase("swing");

      shadowControls.start({
        x: -12,
        scaleX: 0.7,
        opacity: 0.1,
        transition: { duration: 1.1, ease: "easeInOut" },
      });

      glowControls.start({
        opacity: 0.7,
        scale: 1.35,
        transition: { duration: 0.9, ease: "easeOut" },
      });

      // Horizontal swing around the left leg — backOut easing
      // overshoots past -160° then rebounds to resting position
      await swingControls.start({
        rotateY: -180,
        translateZ: -1,
        transition: {
          duration: 1.2,
          ease: [0.175, 0.885, 0.32, 1.275], // backOut
        },
      });

      // Mechanical rebound settle
      await swingControls.start({
        rotateY: -152,
        transition: { duration: 0.2, ease: "easeOut" },
      });
      await swingControls.start({
        rotateY: -156,
        transition: { duration: 0.16, ease: "easeInOut" },
      });

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
      style={{ minWidth: 320, minHeight: 340, perspective: 800 }}
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

      {/* ═══════════════════════════════════════════
          Layout: shackle (HTML div) above lock body (SVG).
          HTML motion.div enables rotateY with perspective.
          ═══════════════════════════════════════════ */}
      <div
        className="relative"
        style={{ width: 150, height: 210, transformStyle: "preserve-3d" }}
      >

        {/* ── SHACKLE (HTML layer for 3D transforms) ── */}
        <motion.div
          animate={popControls}
          initial={{ x: 0, y: CLOSED_Y }}
          className="absolute"
          style={{
            top: 0,
            left: 0,
            width: 150,
            height: 130,
            zIndex: -1,
            transformStyle: "preserve-3d",
          }}
        >
          <motion.div
            animate={swingControls}
            initial={{ rotateY: 0 }}
            style={{
              // Pivot on the LEFT LEG — the vertical hinge axis
              transformOrigin: `${PIVOT_PX_X}px ${PIVOT_PX_Y}px`,
              transformStyle: "preserve-3d",
              width: "100%",
              height: "100%",
            }}
          >
            <svg
              width="150"
              height="130"
              viewBox="-5 -10 130 120"
              fill="none"
              style={{ overflow: "visible" }}
            >
              <defs>
                <linearGradient id="shackleGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#c8c8c8" />
                  <stop offset="25%" stopColor="#b0b0b0" />
                  <stop offset="50%" stopColor="#969696" />
                  <stop offset="75%" stopColor="#808080" />
                  <stop offset="100%" stopColor="#707070" />
                </linearGradient>
                <linearGradient id="shackleHL" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </linearGradient>
              </defs>

              {/* Asymmetric shackle path */}
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
              {/* Specular highlight */}
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
              {/* Right leg bottom cap */}
              <line
                x1={RIGHT_X - 4}
                y1={RIGHT_LEG_BOTTOM}
                x2={RIGHT_X + 4}
                y2={RIGHT_LEG_BOTTOM}
                stroke="#808080"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </motion.div>
        </motion.div>

        {/* ── LOCK BODY (static SVG, overlaps shackle legs) ── */}
        <svg
          className="absolute"
          width="150"
          height="210"
          viewBox="-5 -50 130 220"
          fill="none"
          style={{ overflow: "visible", top: 0, left: 0, zIndex: 2 }}
        >
          <defs>
            <linearGradient id="lockBodyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4a4a5a" />
              <stop offset="25%" stopColor="#3a3a48" />
              <stop offset="50%" stopColor="#2e2e3c" />
              <stop offset="75%" stopColor="#252534" />
              <stop offset="100%" stopColor="#1c1c2a" />
            </linearGradient>
            <linearGradient id="lockBodyHL" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.04)" />
            </linearGradient>
            <radialGradient id="keyholeGrad" cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#1a1a2e" />
              <stop offset="100%" stopColor="#0d0d1a" />
            </radialGradient>
          </defs>

          {/* Drop shadow */}
          <motion.ellipse
            cx={60}
            cy={145}
            rx={38}
            ry={6}
            fill="rgba(0,0,0,0.25)"
            initial={{ scaleX: 1, opacity: 0.2 }}
            animate={shadowControls}
          />

          {/* Lock body */}
          <rect x={BODY_X} y={BODY_Y} width={BODY_W} height={BODY_H}
            rx={BODY_R} fill="url(#lockBodyGrad)" />
          <rect x={BODY_X} y={BODY_Y} width={BODY_W} height={BODY_H}
            rx={BODY_R} fill="url(#lockBodyHL)" />
          {/* Top bevel */}
          <line x1={BODY_X + BODY_R} y1={BODY_Y + 0.5}
            x2={BODY_X + BODY_W - BODY_R} y2={BODY_Y + 0.5}
            stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          {/* Bottom edge */}
          <line x1={BODY_X + BODY_R} y1={BODY_Y + BODY_H - 0.5}
            x2={BODY_X + BODY_W - BODY_R} y2={BODY_Y + BODY_H - 0.5}
            stroke="rgba(0,0,0,0.3)" strokeWidth="1" />

          {/* Shackle holes */}
          <ellipse cx={LEFT_X} cy={BODY_Y + 2} rx={6.5} ry={3.5}
            fill="rgba(0,0,0,0.5)" />
          <ellipse cx={RIGHT_X} cy={BODY_Y + 2} rx={6.5} ry={3.5}
            fill="rgba(0,0,0,0.5)" />
          <ellipse cx={LEFT_X} cy={BODY_Y + 2} rx={6.5} ry={3.5}
            fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
          <ellipse cx={RIGHT_X} cy={BODY_Y + 2} rx={6.5} ry={3.5}
            fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />

          {/* Keyhole */}
          <circle cx={60} cy={99} r={7} fill="url(#keyholeGrad)" />
          <rect x={57} y={99} width={6} height={14} rx={2.5} fill="url(#keyholeGrad)" />
          <circle cx={60} cy={99} r={8.5}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />

          {/* Keyhole breathing glow */}
          {isLocked && (
            <motion.circle
              cx={60} cy={99} r={10}
              fill="none" stroke="#f5a623" strokeWidth="1"
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

          {/* Face plate screws */}
          {[
            [BODY_X + 10, BODY_Y + 10],
            [BODY_X + BODY_W - 10, BODY_Y + 10],
            [BODY_X + 10, BODY_Y + BODY_H - 10],
            [BODY_X + BODY_W - 10, BODY_Y + BODY_H - 10],
          ].map(([cx, cy], i) => (
            <g key={i}>
              <circle cx={cx} cy={cy} r={2.5} fill="rgba(60,60,75,1)" />
              <line
                x1={(cx as number) - 1.5} y1={cy}
                x2={(cx as number) + 1.5} y2={cy}
                stroke="rgba(0,0,0,0.4)" strokeWidth="0.6" />
            </g>
          ))}
        </svg>
      </div>

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
                ease: [0.16, 0.9, 0.4, 1],
                times: [0, 0.3, 1],
              }}
              exit={{ opacity: 0 }}
            />
          ))}
      </AnimatePresence>
    </div>
  );
}
