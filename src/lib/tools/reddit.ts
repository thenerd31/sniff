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

export async function redditSearch(url: string): Promise<EvidenceCard> {
  const domain = new URL(url).hostname.replace(/^www\./, "");

  try {
    // Search Reddit for mentions of this domain
    const searchUrl = `https://www.reddit.com/search.json?q="${domain}"+scam+OR+fraud+OR+legit+OR+review&sort=relevance&limit=10`;
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
        confidence: 0.5,
        connections: [],
        metadata: { domain, postCount: 0 },
      };
    }

    // Analyze sentiment from post titles and content
    const scamKeywords = /scam|fraud|fake|rip.?off|steal|stolen|phishing|avoid|beware|warning/i;
    const negativeCount = posts.filter(
      (p) => scamKeywords.test(p.title) || scamKeywords.test(p.selftext)
    ).length;

    const totalEngagement = posts.reduce(
      (sum, p) => sum + p.score + p.num_comments,
      0
    );

    let severity: CardSeverity;
    let title: string;

    if (negativeCount >= 3) {
      severity = "critical";
      title = `${negativeCount} scam reports found on Reddit`;
    } else if (negativeCount >= 1) {
      severity = "warning";
      title = `${negativeCount} potential scam mention${negativeCount > 1 ? "s" : ""} on Reddit`;
    } else {
      severity = "safe";
      title = `${posts.length} Reddit discussions found (no scam reports)`;
    }

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
      severity,
      title,
      detail: topPosts
        .map((p) => `r/${p.subreddit}: "${p.title}" (${p.score} upvotes)`)
        .join(" | "),
      source: "Reddit Search",
      confidence: 0.75,
      connections: [],
      metadata: {
        domain,
        postCount: posts.length,
        negativeCount,
        totalEngagement,
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
