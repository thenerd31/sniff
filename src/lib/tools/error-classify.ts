import type { CardSeverity } from "@/types";

interface ErrorClassification {
  severity: CardSeverity;
  suspicious: boolean;
}

/**
 * Classifies tool errors into appropriate severities.
 *
 * - NXDOMAIN / DNS failures → "safe" (dead site = not an active threat)
 * - Timeout / 5xx           → "info" + suspicious (cheap/overloaded server)
 * - Auth / API key errors   → "info" (neutral, don't penalize)
 * - Default                 → "info" (never inflate score on errors)
 */
export function classifyToolError(error: unknown): ErrorClassification {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  // DNS resolution failures — site doesn't exist
  if (
    lower.includes("enotfound") ||
    lower.includes("nxdomain") ||
    lower.includes("getaddrinfo")
  ) {
    return { severity: "safe", suspicious: false };
  }

  // Connection refused — server is down
  if (lower.includes("econnrefused")) {
    return { severity: "info", suspicious: false };
  }

  // Timeout or abort — possibly overloaded scam server
  if (
    lower.includes("timeout") ||
    lower.includes("timedout") ||
    lower.includes("aborted") ||
    lower.includes("abort")
  ) {
    return { severity: "info", suspicious: true };
  }

  // Server errors — cheap hosting indicator
  if (/\b5\d{2}\b/.test(message)) {
    return { severity: "info", suspicious: true };
  }

  // API key / auth issues — our config problem, not a signal
  if (
    lower.includes("api key") ||
    lower.includes("unauthorized") ||
    lower.includes("forbidden") ||
    lower.includes("403") ||
    lower.includes("401")
  ) {
    return { severity: "info", suspicious: false };
  }

  // Default: neutral
  return { severity: "info", suspicious: false };
}
