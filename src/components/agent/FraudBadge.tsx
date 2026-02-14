"use client";

import type { FraudMarker } from "@/types";
import { AlertTriangle, ShieldAlert, Info, CheckCircle } from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";

const severityConfig = {
  critical: {
    bg: "bg-red-100",
    text: "text-red-700",
    icon: ShieldAlert,
  },
  warning: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    icon: AlertTriangle,
  },
  info: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    icon: Info,
  },
  safe: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    icon: CheckCircle,
  },
};

export default function FraudBadge({ marker }: { marker: FraudMarker }) {
  const config = severityConfig[marker.severity];
  const Icon = config.icon;

  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} cursor-default`}
          >
            <Icon className="w-3 h-3" />
            {marker.label}
          </span>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="top"
            sideOffset={5}
            className="max-w-xs px-3 py-2 bg-gray-900 text-white text-xs rounded-xl shadow-lg z-50"
          >
            <p>{marker.detail}</p>
            <p className="mt-1 text-gray-400">Source: {marker.source}</p>
            <Tooltip.Arrow className="fill-gray-900" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
