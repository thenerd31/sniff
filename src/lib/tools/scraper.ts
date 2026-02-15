import { v4 as uuidv4 } from "uuid";
import type { EvidenceCard, CardSeverity } from "@/types";

interface RedFlag {
  label: string;
  severity: CardSeverity;
  detail: string;
}

const URGENCY_PATTERNS = [
  /(?:only|just)\s+\d+\s+(?:left|remaining)/i,
  /limited\s+(?:time|stock|offer|quantity)/i,
  /hurry|act\s+now|don'?t\s+miss|expires?\s+(?:soon|today)/i,
  /countdown|timer/i,
  /\d+\s+people?\s+(?:are\s+)?(?:viewing|watching|looking)/i,
  /order\s+(?:within|in)\s+\d+/i,
];

const MISSING_POLICY_PATTERNS = [
  { name: "return policy", pattern: /return\s+polic/i },
  { name: "refund policy", pattern: /refund\s+polic/i },
  { name: "privacy policy", pattern: /privacy\s+polic/i },
  { name: "terms of service", pattern: /terms\s+(?:of\s+service|and\s+conditions)/i },
  { name: "contact information", pattern: /contact\s+us|support@|customer\s+service/i },
];

const SUSPICIOUS_PAYMENT = [
  /(?:wire\s+transfer|western\s+union|moneygram|bitcoin|crypto(?:currency)?|zelle)\s+(?:only|payment)/i,
  /pay\s+(?:via|with|using)\s+(?:gift\s+card|crypto|bitcoin)/i,
];

const PRICE_PATTERNS = [
  /(?:was|original(?:ly)?|regular)\s*[:$]?\s*\$?\d+.*?(?:now|sale|today)\s*[:$]?\s*\$?\d+/i,
  /\d{2,3}%\s+off/i,
  /save\s+\$?\d{2,}/i,
];

/**
 * Scrape a retailer's homepage for red flags.
 * @param url       The retailer URL to scan
 * @param productTitle  Optional — the product title from search results.
 *                      If provided, checks for content mismatch (page sells
 *                      coat hooks but Google Shopping says Sony headphones).
 */
export async function scrapeForRedFlags(url: string, productTitle?: string): Promise<EvidenceCard[]> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });

    // Check if response redirected to a different domain
    const requestDomain = new URL(url).hostname.replace(/^www\./, "");
    const responseDomain = new URL(response.url).hostname.replace(/^www\./, "");

    if (!response.ok) {
      return [
        {
          id: uuidv4(),
          type: "alert",
          severity: "warning",
          title: `Site returned HTTP ${response.status}`,
          detail: `The page responded with status ${response.status} (${response.statusText})`,
          source: "Web Scraper",
          confidence: 0.7,
          connections: [],
          metadata: { status: response.status },
        },
      ];
    }

    const html = await response.text();
    const textContent = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");
    const flags: RedFlag[] = [];

    // Check for redirect to a different domain
    if (requestDomain !== responseDomain) {
      flags.push({
        label: "Domain redirect detected",
        severity: "critical",
        detail: `${requestDomain} redirects to ${responseDomain} — legitimate retailers don't redirect to unrelated domains`,
      });
    }

    // Check for urgency tactics
    for (const pattern of URGENCY_PATTERNS) {
      const match = textContent.match(pattern);
      if (match) {
        flags.push({
          label: "Fake urgency detected",
          severity: "warning",
          detail: `Found urgency tactic: "${match[0].trim()}"`,
        });
        break; // one urgency flag is enough
      }
    }

    // Check for missing policies
    const missingPolicies: string[] = [];
    for (const policy of MISSING_POLICY_PATTERNS) {
      if (!policy.pattern.test(html)) {
        missingPolicies.push(policy.name);
      }
    }
    if (missingPolicies.length >= 3) {
      flags.push({
        label: "Missing standard policies",
        severity: "warning",
        detail: `Missing: ${missingPolicies.join(", ")}`,
      });
    }

    // Check for suspicious payment methods
    for (const pattern of SUSPICIOUS_PAYMENT) {
      const match = textContent.match(pattern);
      if (match) {
        flags.push({
          label: "Suspicious payment method",
          severity: "critical",
          detail: `Found: "${match[0].trim()}" — legitimate retailers accept credit cards`,
        });
        break;
      }
    }

    // Check for extreme discounts
    for (const pattern of PRICE_PATTERNS) {
      const match = textContent.match(pattern);
      if (match) {
        const percentMatch = match[0].match(/(\d{2,3})%/);
        if (percentMatch && parseInt(percentMatch[1]) >= 70) {
          flags.push({
            label: "Extreme discount claims",
            severity: "warning",
            detail: `Claims ${percentMatch[1]}% discount — unusually high discounts are a common scam tactic`,
          });
        }
        break;
      }
    }

    // Check for recently created page (meta tags)
    const metaDate = html.match(
      /meta\s+(?:name|property)=["'](?:article:published_time|date|og:published_time)["']\s+content=["']([^"']+)["']/i
    );
    if (metaDate) {
      const published = new Date(metaDate[1]);
      const daysSince = Math.floor(
        (Date.now() - published.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSince < 14) {
        flags.push({
          label: "Very recently published page",
          severity: "info",
          detail: `Page was published ${daysSince} days ago`,
        });
      }
    }

    // Check for fake trust badges (text claims without real verification)
    const FAKE_TRUST_PATTERNS = [
      /ssl\s+(?:certified|secured?|protected)/i,
      /(?:100%|fully)\s+(?:secure|safe)\s+(?:payment|checkout|shopping)/i,
      /(?:verified|certified)\s+(?:by|secure)\s+(?:visa|mastercard|paypal|norton|mcafee)/i,
      /money.?back\s+guarantee.*?(?:100%|no\s+questions)/i,
      /trusted\s+(?:shop|store|seller)\s+(?:certified|verified|guaranteed)/i,
    ];
    for (const pattern of FAKE_TRUST_PATTERNS) {
      const match = textContent.match(pattern);
      if (match) {
        flags.push({
          label: "Fake trust badge",
          severity: "warning",
          detail: `Claims "${match[0].trim()}" — scam sites commonly display fake security badges`,
        });
        break;
      }
    }

    // Check for content mismatch: Google Shopping says "Sony headphones"
    // but the page is actually about coat hooks
    if (productTitle) {
      const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const pageTitle = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : "";

      if (pageTitle && pageTitle.length > 10) {
        // Extract key product words from the search result title
        const productWords = productTitle
          .toLowerCase()
          .split(/\s+/)
          .filter((w) => w.length > 3 && !/^(with|from|the|and|for)$/.test(w));

        const pageTitleLower = pageTitle.toLowerCase();
        const matchCount = productWords.filter((w) => pageTitleLower.includes(w)).length;
        const matchRatio = productWords.length > 0 ? matchCount / productWords.length : 1;

        if (matchRatio < 0.2 && productWords.length >= 3) {
          flags.push({
            label: "Content mismatch",
            severity: "critical",
            detail: `Google Shopping lists "${productTitle.slice(0, 60)}" but page title is "${pageTitle.slice(0, 60)}" — SEO poisoning or bait-and-switch`,
          });
        }
      }
    }

    if (flags.length === 0) {
      return [
        {
          id: uuidv4(),
          type: "alert",
          severity: "safe",
          title: "No obvious red flags found",
          detail: "Page content scan did not reveal common scam indicators",
          source: "Web Scraper",
          confidence: 0.6,
          connections: [],
          metadata: { flagsChecked: URGENCY_PATTERNS.length + MISSING_POLICY_PATTERNS.length },
        },
      ];
    }

    return flags.map((flag) => ({
      id: uuidv4(),
      type: "alert" as const,
      severity: flag.severity,
      title: flag.label,
      detail: flag.detail,
      source: "Web Scraper",
      confidence: 0.7,
      connections: [],
      metadata: {},
    }));
  } catch (error) {
    return [
      {
        id: uuidv4(),
        type: "alert",
        severity: "info",
        title: "Could not scrape page",
        detail: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        source: "Web Scraper",
        confidence: 0,
        connections: [],
        metadata: { error: true },
      },
    ];
  }
}
