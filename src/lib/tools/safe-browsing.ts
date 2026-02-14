import { v4 as uuidv4 } from "uuid";
import type { EvidenceCard } from "@/types";

interface ThreatMatch {
  threatType: string;
  platformType: string;
  threat: { url: string };
  cacheDuration: string;
}

interface SafeBrowsingResponse {
  matches?: ThreatMatch[];
}

const THREAT_LABELS: Record<string, string> = {
  MALWARE: "Malware",
  SOCIAL_ENGINEERING: "Phishing / Social Engineering",
  UNWANTED_SOFTWARE: "Unwanted Software",
  POTENTIALLY_HARMFUL_APPLICATION: "Potentially Harmful Application",
};

export async function safeBrowsingCheck(url: string): Promise<EvidenceCard> {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;
  if (!apiKey) {
    return {
      id: uuidv4(),
      type: "alert",
      severity: "info",
      title: "Safe Browsing check skipped",
      detail: "Google Safe Browsing API key not configured",
      source: "Google Safe Browsing",
      confidence: 0,
      connections: [],
      metadata: { skipped: true },
    };
  }

  try {
    const response = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: { clientId: "sentinel", clientVersion: "1.0.0" },
          threatInfo: {
            threatTypes: [
              "MALWARE",
              "SOCIAL_ENGINEERING",
              "UNWANTED_SOFTWARE",
              "POTENTIALLY_HARMFUL_APPLICATION",
            ],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url }],
          },
        }),
      }
    );

    const data: SafeBrowsingResponse = await response.json();

    if (data.matches && data.matches.length > 0) {
      const threats = data.matches.map(
        (m) => THREAT_LABELS[m.threatType] || m.threatType
      );

      return {
        id: uuidv4(),
        type: "alert",
        severity: "critical",
        title: `Flagged by Google Safe Browsing`,
        detail: `Threats detected: ${threats.join(", ")}`,
        source: "Google Safe Browsing",
        confidence: 0.98,
        connections: [],
        metadata: { threats: data.matches },
      };
    }

    return {
      id: uuidv4(),
      type: "alert",
      severity: "safe",
      title: "Not flagged by Google Safe Browsing",
      detail: "This URL has no known threats in Google's database",
      source: "Google Safe Browsing",
      confidence: 0.85,
      connections: [],
      metadata: { clean: true },
    };
  } catch (error) {
    return {
      id: uuidv4(),
      type: "alert",
      severity: "info",
      title: "Safe Browsing check failed",
      detail: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      source: "Google Safe Browsing",
      confidence: 0,
      connections: [],
      metadata: { error: true },
    };
  }
}
