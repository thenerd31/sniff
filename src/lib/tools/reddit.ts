import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";
import type { EvidenceCard, CardSeverity } from "@/types";

interface RedditPost {
  title: string;
  selftext: string;
  subreddit: string;
  score: number;
  num_comments: number;
  permalink: string;
  created_utc: number;
}

interface RedditSearchResponse {
  data: {
    children: { data: RedditPost }[];
  };
}

interface LLMVerdict {
  sentiment: "scam" | "suspicious" | "mixed" | "legitimate" | "unrelated";
  severity: CardSeverity;
  confidence: number;
  summary: string;
  key_findings: string[];
  relevantPostCount: number;
}

// Subreddits that indicate the post is about scam/trust analysis
const TRUST_SUBREDDITS = new Set([
  "scams", "scam", "isitascam", "isitbullshit", "fraudalert",
  "reviews", "sitereview", "consumerprotection",
]);

export async function redditSearch(url: string): Promise<EvidenceCard> {
  const domain = new URL(url).hostname.replace(/^www\./, "");
  // Strip TLD for brand name: "nacelexpert.com" → "nacelexpert"
  const brandName = domain.split(".")[0];

  try {
    // Run multiple targeted searches in parallel for better coverage
    const searches = [
      // Search 1: Domain + scam-related terms
      fetchRedditPosts(`"${domain}" scam OR legit OR review OR fraud OR fake`),
      // Search 2: Brand name + scam (catches posts that don't include the full URL)
      fetchRedditPosts(`"${brandName}" scam OR legit OR review OR ripoff`),
      // Search 3: Exact domain in scam-focused subreddits
      fetchRedditPosts(`"${domain}"`, "scams"),
    ];

    const results = await Promise.allSettled(searches);
    const allPosts = new Map<string, RedditPost>(); // dedup by permalink

    for (const result of results) {
      if (result.status === "fulfilled") {
        for (const post of result.value) {
          allPosts.set(post.permalink, post);
        }
      }
    }

    const posts = [...allPosts.values()];

    if (posts.length === 0) {
      return {
        id: uuidv4(),
        type: "review_analysis",
        severity: "info",
        title: `No Reddit discussions found for ${domain}`,
        detail: `No posts mentioning "${domain}" found on Reddit — this site has zero online presence, which is suspicious for any retailer`,
        source: "Reddit Search",
        confidence: 0.3,
        connections: [],
        metadata: { domain, postCount: 0 },
      };
    }

    // Pre-filter: prioritize posts that are actually about the retailer
    const scoredPosts = posts.map((p) => {
      let relevanceScore = 0;
      const titleLower = p.title.toLowerCase();
      const textLower = (p.selftext || "").toLowerCase();
      const combined = titleLower + " " + textLower;

      // Post mentions domain in title → very likely about the store
      if (titleLower.includes(domain) || titleLower.includes(brandName)) {
        relevanceScore += 10;
      }

      // Scam/trust keywords in title → high relevance
      if (/scam|legit|fraud|fake|review|trust|safe|ripoff|complaint/.test(titleLower)) {
        relevanceScore += 5;
      }

      // Posted in trust-related subreddits
      if (TRUST_SUBREDDITS.has(p.subreddit.toLowerCase())) {
        relevanceScore += 8;
      }

      // Post body discusses the domain specifically
      if (combined.includes(domain)) {
        relevanceScore += 3;
      }

      // Shopping/ecommerce subreddits
      if (/deals|shopping|frugal|buyitforlife|consumer/.test(p.subreddit.toLowerCase())) {
        relevanceScore += 2;
      }

      // Penalize posts that just happen to contain a link
      // (like someone sharing a poshmark listing in a wedding sub)
      if (relevanceScore <= 3 && !combined.includes("scam") && !combined.includes("legit")) {
        relevanceScore = 0; // likely incidental mention
      }

      return { post: p, relevanceScore };
    });

    // Sort by relevance, take top 10
    scoredPosts.sort((a, b) => b.relevanceScore - a.relevanceScore);
    const relevantPosts = scoredPosts
      .filter((p) => p.relevanceScore > 0)
      .slice(0, 10)
      .map((p) => p.post);

    // If no relevant posts after filtering, treat as no presence
    if (relevantPosts.length === 0) {
      return {
        id: uuidv4(),
        type: "review_analysis",
        severity: "info",
        title: `No relevant Reddit discussions for ${domain}`,
        detail: `Found ${posts.length} posts mentioning "${domain}" but none discuss the retailer's trustworthiness — only incidental mentions`,
        source: "Reddit Search",
        confidence: 0.4,
        connections: [],
        metadata: { domain, postCount: posts.length, relevantCount: 0 },
      };
    }

    // Build context for LLM analysis
    const postSummaries = relevantPosts.map((p) => {
      const age = Math.floor(
        (Date.now() / 1000 - p.created_utc) / (60 * 60 * 24)
      );
      const text = p.selftext.length > 500 ? p.selftext.slice(0, 500) + "..." : p.selftext;
      return `[r/${p.subreddit} | ${p.score} upvotes | ${p.num_comments} comments | ${age} days ago]\nTitle: ${p.title}\n${text ? `Body: ${text}` : "(no body)"}`;
    });

    const verdict = await analyzeWithLLM(domain, postSummaries);

    const topPosts = relevantPosts.slice(0, 3).map((p) => ({
      title: p.title,
      subreddit: p.subreddit,
      score: p.score,
      comments: p.num_comments,
      url: `https://reddit.com${p.permalink}`,
    }));

    return {
      id: uuidv4(),
      type: "review_analysis",
      severity: verdict.severity,
      title: verdict.summary,
      detail: verdict.key_findings.join(" | "),
      source: "Reddit Search (AI-analyzed)",
      confidence: verdict.confidence,
      connections: [],
      metadata: {
        domain,
        postCount: posts.length,
        relevantCount: relevantPosts.length,
        sentiment: verdict.sentiment,
        topPosts,
      },
    };
  } catch (error) {
    return {
      id: uuidv4(),
      type: "review_analysis",
      severity: "info",
      title: "Reddit search failed",
      detail: `Could not search Reddit: ${error instanceof Error ? error.message : "Unknown error"}`,
      source: "Reddit Search",
      confidence: 0,
      connections: [],
      metadata: { domain, error: true },
    };
  }
}

async function fetchRedditPosts(
  query: string,
  subreddit?: string,
): Promise<RedditPost[]> {
  const base = subreddit
    ? `https://www.reddit.com/r/${subreddit}/search.json`
    : `https://www.reddit.com/search.json`;

  const params = new URLSearchParams({
    q: query,
    sort: "relevance",
    limit: "15",
    ...(subreddit ? { restrict_sr: "true" } : {}),
  });

  const response = await fetch(`${base}?${params}`, {
    headers: { "User-Agent": "Sentinel/1.0 (Shopping Fraud Detector)" },
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) return [];

  const data: RedditSearchResponse = await response.json();
  return data.data.children.map((c) => c.data);
}

async function analyzeWithLLM(
  domain: string,
  postSummaries: string[]
): Promise<LLMVerdict> {
  const openai = new OpenAI();

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    temperature: 1,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a scam analysis expert. You will be given Reddit posts related to the domain "${domain}". Your job is to determine if this is a trustworthy retailer.

CRITICAL: Only consider posts that are ACTUALLY ABOUT the retailer/domain "${domain}". Ignore posts that:
- Just happen to contain a link to ${domain} (e.g., someone sharing a product listing)
- Are about a completely different topic but mention the domain incidentally
- Are referral code spam

Focus on posts where users:
- Discuss whether ${domain} is legitimate or a scam
- Share purchase experiences (positive or negative)
- Report fraud, non-delivery, counterfeit goods, or billing issues
- Review the retailer's customer service, shipping, returns

Respond with JSON:
{
  "sentiment": "scam" | "suspicious" | "mixed" | "legitimate" | "unrelated",
  "severity": "critical" | "warning" | "info" | "safe",
  "confidence": <0.0-1.0>,
  "summary": "<one-line summary about the RETAILER, e.g. 'Multiple users report ${domain} never delivers orders'>",
  "key_findings": ["<finding 1>", "<finding 2>", "<finding 3>"],
  "relevantPostCount": <number of posts that are actually about the retailer>
}

If NONE of the posts are actually about the retailer's trustworthiness, return:
- sentiment: "unrelated", severity: "info", relevantPostCount: 0
- summary: "No relevant discussions about ${domain} found"

Mapping:
- "scam" → "critical": Credible reports of fraud or deception
- "suspicious" → "warning": Red flags but not conclusive
- "mixed" → "info": Both positive and negative, inconclusive
- "legitimate" → "safe": Positive experiences, established retailer
- "unrelated" → "info": Posts don't discuss the retailer's trustworthiness`,
      },
      {
        role: "user",
        content: `Analyze these Reddit posts about "${domain}":\n\n${postSummaries.join("\n\n---\n\n")}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("LLM returned empty response");
  }

  return JSON.parse(content) as LLMVerdict;
}
