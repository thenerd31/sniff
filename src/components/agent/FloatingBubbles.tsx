"use client";

const bubbles = [
  { size: 120, top: "10%", left: "5%", delay: 0, duration: 7, opacity: 0.15 },
  { size: 80, top: "20%", right: "10%", delay: 1, duration: 8, opacity: 0.12 },
  { size: 200, bottom: "15%", left: "15%", delay: 2, duration: 9, opacity: 0.08 },
  { size: 60, top: "50%", right: "20%", delay: 0.5, duration: 6, opacity: 0.18 },
  { size: 140, top: "65%", left: "60%", delay: 3, duration: 10, opacity: 0.1 },
  { size: 90, top: "30%", left: "40%", delay: 1.5, duration: 7.5, opacity: 0.12 },
  { size: 50, bottom: "30%", right: "5%", delay: 2.5, duration: 6.5, opacity: 0.2 },
];

export default function FloatingBubbles() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      {bubbles.map((b, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: b.size,
            height: b.size,
            top: b.top,
            left: b.left,
            right: (b as any).right,
            bottom: (b as any).bottom,
            background: `radial-gradient(circle, rgba(255,255,255,${b.opacity + 0.1}) 0%, rgba(255,255,255,${b.opacity}) 100%)`,
            animation: `float-slow ${b.duration}s ease-in-out ${b.delay}s infinite`,
            filter: "blur(1px)",
          }}
        />
      ))}
    </div>
  );
}
