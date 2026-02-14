import { v4 as uuidv4 } from "uuid";
import type { EvidenceCard, CardSeverity } from "@/types";

interface ScamAdviserResponse {
  trustScore?: number;
  domain?: string;
  title?: string;
  risk?: string;
  categories?: string[];
}

export async function scamadviserCheck(url: string): Promise<EvidenceCard> {
  const apiKey = process.env.SCAMADVISER_API_KEY;
  const domain = new URL(url).hostname.replace(/^www\./, "");

  if (!apiKey) {
    return {
      id: uuidv4(),
      type: "scam_report",
      severity: "info",
      title: "ScamAdviser check skipped",
      detail: "ScamAdviser API key not configured",
      source: "ScamAdviser",
      confidence: 0,
      connections: [],
      metadata: { skipped: true },
    };
  }

  try {
    const response = await fetch(
      `https://api.scamadviser.com/v2/trust/${domain}?apikey=${apiKey}`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!response.ok) {
      throw new Error(`ScamAdviser API returned ${response.status}`);
    }

    const data: ScamAdviserResponse = await response.json();
    const trustScore = data.trustScore ?? -1;

    let severity: CardSeverity;
    let title: string;

    if (trustScore < 0) {
      severity = "info";
      title = "ScamAdviser has no data for this domain";
    } else if (trustScore <= 20) {
      severity = "critical";
      title = `ScamAdviser trust score: ${trustScore}/100 (Very Low)`;
    } else if (trustScore <= 50) {
      severity = "warning";
      title = `ScamAdviser trust score: ${trustScore}/100 (Low)`;
    } else if (trustScore <= 75) {
      severity = "info";
      title = `ScamAdviser trust score: ${trustScore}/100 (Medium)`;
    } else {
      severity = "safe";
      title = `ScamAdviser trust score: ${trustScore}/100 (High)`;
    }

    const details: string[] = [];
    if (trustScore >= 0) details.push(`Trust Score: ${trustScore}/100`);
    if (data.risk) details.push(`Risk: ${data.risk}`);
    if (data.categories?.length) details.push(`Categories: ${data.categories.join(", ")}`);

    return {
      id: uuidv4(),
      type: "scam_report",
      severity,
      title,
      detail: details.join(" | ") || "No additional details available",
      source: "ScamAdviser",
      confidence: trustScore >= 0 ? 0.85 : 0.3,
      connections: [],
      metadata: {
        domain,
        trustScore,
        risk: data.risk,
        categories: data.categories,
      },
    };
  } catch (error) {
    return {
      id: uuidv4(),
      type: "scam_report",
      severity: "info",
      title: "ScamAdviser check failed",
      detail: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      source: "ScamAdviser",
      confidence: 0,
      connections: [],
      metadata: { domain, error: true },
    };
  }
}
