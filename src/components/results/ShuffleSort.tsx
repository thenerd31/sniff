"use client";

import { useEffect, useRef, useMemo } from "react";
import { FlipCard } from "./FlipCard";
import { useResultsStore } from "@/stores/resultsStore";
import type { ProductWithVerdict } from "@/types";

const PIXEL_FONT = "'Press Start 2P', monospace";

interface ShuffleSortProps {
  products: ProductWithVerdict[];
  onComplete: () => void;
}

export function ShuffleSort({ products, onComplete }: ShuffleSortProps) {
  const completeFired = useRef(false);
  const savedItems = useResultsStore((s) => s.savedItems);
  const toggleSave = useResultsStore((s) => s.toggleSave);

  const randomPositions = useMemo(
    () =>
      products.map(() => ({
        x: (Math.random() - 0.5) * 500,
        y: (Math.random() - 0.5) * 300,
        rotate: (Math.random() - 0.5) * 50,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [products.length]
  );

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => a.price - b.price),
    [products]
  );

  const cardW = 240;
  const gap = 24;
  const totalW = sortedProducts.length * cardW + (sortedProducts.length - 1) * gap;
  const originX = -totalW / 2 + cardW / 2;

  const finalPositionMap = useMemo(() => {
    const m: Record<string, number> = {};
    sortedProducts.forEach((p, i) => {
      m[p.id] = originX + i * (cardW + gap);
    });
    return m;
  }, [sortedProducts, originX]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!completeFired.current) {
        completeFired.current = true;
        onComplete();
      }
    }, 3200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const productIndexMap = useMemo(() => {
    const m: Record<string, number> = {};
    products.forEach((p, i) => {
      m[p.id] = i;
    });
    return m;
  }, [products]);

  return (
    <div className="relative w-full overflow-hidden" style={{ height: 500 }}>
      {/* "Sorting by price..." overlay — pixel dialogue */}
      <div
        className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
        style={{
          animation: "sorting-label 1.4s ease 0.7s both",
        }}
      >
        <div
          style={{
            border: "4px solid #1A1A1A",
            background: "#FFF8E8",
            boxShadow: "4px 4px 0 #1A1A1A",
            padding: "10px 20px",
          }}
        >
          <p style={{ fontFamily: PIXEL_FONT, fontSize: 8, color: "#8B6914" }}>
            SORTING BY PRICE...
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className="absolute inset-0 flex items-center justify-center">
        {products.map((product) => {
          const i = productIndexMap[product.id] ?? 0;
          const scatter = randomPositions[i] || { x: 0, y: 0, rotate: 0 };
          const finalX = finalPositionMap[product.id] ?? 0;
          const consolidateDelay = 1.4 + i * 0.06;

          return (
            <div
              key={product.id}
              className="absolute"
              style={{
                "--scatter-x": `${scatter.x}px`,
                "--scatter-y": `${scatter.y}px`,
                "--scatter-rot": `${scatter.rotate}deg`,
                "--final-x": `${finalX}px`,
                animation: `shuffle-scatter 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.04}s both, shuffle-consolidate 0.7s cubic-bezier(0.22, 1, 0.36, 1) ${consolidateDelay}s forwards`,
              } as React.CSSProperties}
            >
              <FlipCard
                product={product}
                isSaved={savedItems.includes(product.id)}
                onToggleSave={() => toggleSave(product.id)}
                className="w-[240px] h-[320px]"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
