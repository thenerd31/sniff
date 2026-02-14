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
}

export async function redditSearch(url: string): Promise<EvidenceCard> {
  const domain = new URL(url).hostname.replace(/^www\./, "");

  try {
    // Search Reddit for ALL mentions of this domain (unbiased query)
    const searchUrl = `https://www.reddit.com/search.json?q="${domain}"&sort=relevance&limit=25`;
    const response = await fetch(searchUrl, {
      headers: {
        "User-Agent": "Sentinel/1.0 (Investigation Bot)",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Reddit API returned ${response.status}`);
    }

    const data: RedditSearchResponse = await response.json();
    const posts = data.data.children.map((c) => c.data);

    if (posts.length === 0) {
      return {
        id: uuidv4(),
        type: "review_analysis",
        severity: "info",
        title: "No Reddit discussions found",
        detail: `No posts mentioning "${domain}" found on Reddit — this could mean the site is too new or obscure`,
        source: "Reddit Search",
        confidence: 0.3,
        connections: [],
        metadata: { domain, postCount: 0 },
      };
    }

    // Build context for LLM analysis
    const postSummaries = posts.slice(0, 15).map((p) => {
      const age = Math.floor(
        (Date.now() / 1000 - p.created_utc) / (60 * 60 * 24)
      );
      const text = p.selftext.length > 500 ? p.selftext.slice(0, 500) + "..." : p.selftext;
      return `[r/${p.subreddit} | ${p.score} upvotes | ${p.num_comments} comments | ${age} days ago]\nTitle: ${p.title}\n${text ? `Body: ${text}` : "(no body)"}`;
    });

    const verdict = await analyzeWithLLM(domain, postSummaries);

    const topPosts = posts.slice(0, 3).map((p) => ({
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

async function analyzeWithLLM(
  domain: string,
  postSummaries: string[]
): Promise<LLMVerdict> {
  const openai = new OpenAI();

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a scam analysis expert. You will be given Reddit posts that mention a domain. Analyze the posts to determine whether the domain is trustworthy.

Pay attention to:
- What real users are saying about their experiences (positive or negative)
- Whether complaints describe concrete scam patterns (never received product, impossible to get refund, fake goods, phishing, identity theft)
- Whether positive posts seem authentic or astroturfed (generic praise, new accounts, suspiciously similar wording)
- The subreddit context (r/Scams posts carry different weight than r/deals)
- Engagement signals (high-upvote warnings are more credible than 0-upvote posts)
- Recency (recent reports matter more than old ones)

Respond with a JSON object:
{
  "sentiment": "scam" | "suspicious" | "mixed" | "legitimate" | "unrelated",
  "severity": "critical" | "warning" | "info" | "safe",
  "confidence": <0.0-1.0 how confident you are in this assessment>,
  "summary": "<one-line summary for the evidence card title, e.g. 'Multiple users report never receiving orders'>",
  "key_findings": ["<finding 1>", "<finding 2>", "<finding 3>"]
}

Mapping guide:
- "scam" → "critical": Multiple credible reports of fraud, theft, or deception
- "suspicious" → "warning": Some red flags or complaints but not conclusive
- "mixed" → "info": Both positive and negative signals, inconclusive
- "legitimate" → "safe": Predominantly positive experiences, no scam indicators
- "unrelated" → "info": Posts mention the domain but don't discuss trustworthiness`,
      },
      {
        role: "user",
        content: `Analyze these Reddit posts about the domain "${domain}":\n\n${postSummaries.join("\n\n---\n\n")}`,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("LLM returned empty response");
  }

  return JSON.parse(content) as LLMVerdict;
}
