"use client";

import { CheckCircle, AlertTriangle, XCircle, Clock, ShieldCheck } from "lucide-react";
import type { FraudCheck, FraudCheckStatus, ProductWithVerdict } from "@/types";

interface CardBackProps {
  product: ProductWithVerdict;
}

const statusIcons: Record<FraudCheckStatus, React.ReactNode> = {
  passed: <CheckCircle size={16} className="text-emerald-500" />,
  warning: <AlertTriangle size={16} className="text-amber-500" />,
  failed: <XCircle size={16} className="text-red-400" />,
  pending: <Clock size={16} className="text-gray-400" />,
};

function getSeverityColor(severity: number): string {
  if (severity < 0.3) return "bg-emerald-500";
  if (severity <= 0.6) return "bg-amber-500";
  return "bg-red-400";
}

function FraudCheckRow({ check }: { check: FraudCheck }) {
  return (
    <div className="flex items-start gap-2.5 py-2 border-b border-[var(--surface-2)] last:border-0">
      <div className="mt-0.5 shrink-0">{statusIcons[check.status]}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-xs font-semibold text-[var(--foreground)]">
            {check.name}
          </span>
        </div>
        <p className="text-[10px] text-[var(--text-muted)] leading-tight mb-1.5">
          {check.detail}
        </p>
        {/* Severity bar */}
        <div className="w-full h-1 rounded-full bg-[var(--surface-2)]">
          <div
            className={`h-full rounded-full transition-all ${getSeverityColor(check.severity)}`}
            style={{ width: `${check.severity * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function CardBack({ product }: CardBackProps) {
  const verdictColor =
    product.verdict === "trusted"
      ? "text-emerald-600"
      : product.verdict === "caution"
      ? "text-amber-600"
      : "text-red-500";

  return (
    <div
      className="
        w-full h-full rounded-3xl p-5 flex flex-col
        bg-white border border-[var(--border)]
        shadow-[0_2px_20px_rgba(0,0,0,0.05)]
      "
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[var(--surface-2)]">
        <ShieldCheck size={18} className={verdictColor} />
        <h4 className="text-sm font-bold text-[var(--foreground)]">Fraud Analysis</h4>
        <span className={`ml-auto text-lg font-bold ${verdictColor}`}>
          {product.trustScore}
        </span>
      </div>

      {/* Fraud checks */}
      <div className="flex-1 overflow-y-auto">
        {product.checks.length > 0 ? (
          product.checks.map((check, i) => (
            <FraudCheckRow key={`${check.name}-${i}`} check={check} />
          ))
        ) : (
          <p className="text-xs text-[var(--text-subtle)] text-center py-4">
            No fraud checks available
          </p>
        )}
      </div>

      {/* Domain */}
      <div className="mt-2 pt-2 border-t border-[var(--surface-2)]">
        <p className="text-[10px] font-mono text-[var(--text-subtle)] text-center">
          {product.domain}
        </p>
      </div>
    </div>
  );
}
