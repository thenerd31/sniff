import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";
import type { EvidenceCard } from "@/types";
import { classifyToolError } from "./error-classify";

interface ImpersonationVerdict {
  isImpersonating: boolean;
  targetBrand: string;
  confidence: number;
  explanation: string;
}

async function fetchPageTitle(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(8000),
  });

  const html = await response.text();
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return titleMatch ? titleMatch[1].trim().replace(/\s+/g, " ").slice(0, 200) : "";
}

export async function brandImpersonationCheck(
  url: string
): Promise<EvidenceCard> {
  const hostname = new URL(url).hostname.replace(/^www\./, "");

  try {
    let pageTitle = "";
    try {
      pageTitle = await fetchPageTitle(url);
    } catch {
      // Page unreachable — still analyze the URL structure alone
    }

    const openai = new OpenAI();
    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You detect brand impersonation in URLs and page titles.

Analyze whether this domain is impersonating a well-known brand or company. Consider:
- Typosquatting: misspellings of known brands (amaz0n, g00gle, paypai)
- Brand in subdomain/path: legitimate-brand.evil-domain.com
- Keyword stuffing: apple-support-team.com, paypal-secure-login.net
- Lookalike TLDs: amazon.shop, google.support (not the real company)
- Homograph attacks: using similar-looking characters

NOT impersonation:
- The actual brand's official domain (apple.com, paypal.com)
- Unrelated businesses that happen to share a word (applebees.com, amazon-river-tours.com)
- News or review sites discussing brands

Respond with JSON:
{
  "isImpersonating": boolean,
  "targetBrand": "brand name or empty string",
  "confidence": 0.0 to 1.0,
  "explanation": "brief reasoning"
}`,
        },
        {
          role: "user",
          content: `Domain: ${hostname}\nPage title: ${pageTitle || "(could not fetch)"}`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("LLM returned empty response");

    const verdict: ImpersonationVerdict = JSON.parse(content);

    if (verdict.isImpersonating && verdict.confidence >= 0.7) {
      return {
        id: uuidv4(),
        type: "alert",
        severity: "critical",
        title: `Likely impersonating ${verdict.targetBrand}`,
        detail: verdict.explanation,
        source: "Brand Impersonation",
        confidence: verdict.confidence,
        connections: [],
        metadata: {
          domain: hostname,
          pageTitle,
          isImpersonating: verdict.isImpersonating,
          targetBrand: verdict.targetBrand,
          confidence: verdict.confidence,
        },
      };
    }

    return {
      id: uuidv4(),
      type: "alert",
      severity: "safe",
      title: "No brand impersonation detected",
      detail: verdict.explanation || "Domain does not appear to impersonate a known brand",
      source: "Brand Impersonation",
      confidence: verdict.confidence ?? 0.8,
      connections: [],
      metadata: {
        domain: hostname,
        pageTitle,
        isImpersonating: false,
        targetBrand: verdict.targetBrand,
        confidence: verdict.confidence,
      },
    };
  } catch (error) {
    const classification = classifyToolError(error);
    return {
      id: uuidv4(),
      type: "alert",
      severity: classification.severity,
      title: "Brand impersonation check failed",
      detail: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      source: "Brand Impersonation",
      confidence: 0,
      connections: [],
      metadata: { domain: hostname, error: true, suspicious: classification.suspicious },
    };
  }
}
