import { v4 as uuidv4 } from "uuid";
import type { EvidenceCard, CardSeverity } from "@/types";

interface PerplexityMessage {
  role: string;
  content: string;
}

export async function webSearch(url: string): Promise<EvidenceCard> {
  const domain = new URL(url).hostname.replace(/^www\./, "");
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    return {
      id: uuidv4(),
      type: "alert",
      severity: "info",
      title: "Web search skipped",
      detail: "Perplexity API key not configured",
      source: "Web Search",
      confidence: 0,
      connections: [],
      metadata: { skipped: true },
    };
  }

  try {
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "user",
            content: `Is "${domain}" a legitimate website? Search for scam reports, reviews, complaints, and any red flags. Include specific findings with sources. If this is a well-known legitimate site, say so. Be factual and specific.`,
          },
        ],
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      throw new Error(`Perplexity API returned ${res.status}`);
    }

    const data = await res.json();
    const content: string = data.choices?.[0]?.message?.content || "";

    if (!content) {
      throw new Error("Empty response from Perplexity");
    }

    // Determine severity based on content
    const lowerContent = content.toLowerCase();
    let severity: CardSeverity = "info";
    let confidence = 0.7;

    if (
      lowerContent.includes("scam") ||
      lowerContent.includes("fraud") ||
      lowerContent.includes("fake") ||
      lowerContent.includes("phishing")
    ) {
      severity = "critical";
      confidence = 0.85;
    } else if (
      lowerContent.includes("suspicious") ||
      lowerContent.includes("caution") ||
      lowerContent.includes("complaint") ||
      lowerContent.includes("warning")
    ) {
      severity = "warning";
      confidence = 0.75;
    } else if (
      lowerContent.includes("legitimate") ||
      lowerContent.includes("trusted") ||
      lowerContent.includes("well-known") ||
      lowerContent.includes("established")
    ) {
      severity = "safe";
      confidence = 0.8;
    }

    // Truncate if too long
    const detail =
      content.length > 500 ? content.slice(0, 497) + "..." : content;

    return {
      id: uuidv4(),
      type: "scam_report",
      severity,
      title:
        severity === "critical"
          ? `Web search found scam reports for ${domain}`
          : severity === "warning"
            ? `Web search found concerns about ${domain}`
            : severity === "safe"
              ? `${domain} appears to be a legitimate site`
              : `Web research results for ${domain}`,
      detail,
      source: "Web Search (Perplexity)",
      confidence,
      connections: [],
      metadata: { domain, rawResponse: content },
    };
  } catch (error) {
    return {
      id: uuidv4(),
      type: "alert",
      severity: "info",
      title: "Web search failed",
      detail: `Could not research domain: ${error instanceof Error ? error.message : "Unknown error"}`,
      source: "Web Search",
      confidence: 0,
      connections: [],
      metadata: { domain, error: true },
    };
  }
}
