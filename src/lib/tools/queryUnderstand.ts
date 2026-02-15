import OpenAI from "openai";

const openai = new OpenAI();

interface QueryUnderstanding {
  productName: string;
  searchQueries: string[];
  isSpecific: boolean; // true if user gave a specific brand/model
}

/**
 * Phase 1: Understand the user's shopping intent.
 * - Text input → gpt-5 converts vague descriptions into search queries
 * - Image input → gpt-5 Vision identifies the product, then generates queries
 */
export async function understandQuery(input: {
  query?: string;
  image?: string;
}): Promise<QueryUnderstanding> {
  // ── Image input: identify product first ───────────────────────────────
  if (input.image) {
    const visionResponse = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: `You are a product identification expert. Describe the product in the image for a shopping search. Return JSON:
{
  "productName": "mid-century wooden tripod floor lamp with white shade",
  "searchQueries": ["wooden tripod floor lamp", "mid century floor lamp white shade", "tripod standing lamp wood"],
  "isSpecific": false
}`,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${input.image}` },
            },
            { type: "text", text: "What product is this? Generate search queries to find it online." },
          ],
        },
      ],
      response_format: { type: "json_object" },
      temperature: 1,
    });

    const content = visionResponse.choices[0]?.message?.content;
    if (content) {
      return JSON.parse(content) as QueryUnderstanding;
    }
  }

  // ── Text input: expand vague query into search queries ────────────────
  const query = input.query || "";

  // If it's already a specific product name (brand + model), skip expansion
  const specificPattern = /\b(apple|samsung|sony|nike|adidas|bose|lg|dell|hp|lenovo|asus|google|airpods|iphone|ipad|macbook|galaxy|pixel)\b/i;
  if (specificPattern.test(query) && query.split(" ").length >= 3) {
    return {
      productName: query,
      searchQueries: [query],
      isSpecific: true,
    };
  }

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    messages: [
      {
        role: "system",
        content: `You are a shopping search expert. Convert the user's shopping request into specific search queries optimized for Google Shopping.

Return JSON:
{
  "productName": "concise product description",
  "searchQueries": ["query 1", "query 2", "query 3"],
  "isSpecific": false
}

Rules:
- Generate 2-4 search queries, from most specific to broadest
- Include material, style, color, brand if mentioned
- If the query mentions a price range, include it in queries
- If the query is very specific (brand + model), set isSpecific: true and return just that as a single query
- Keep queries concise — like what you'd type into Google Shopping`,
      },
      {
        role: "user",
        content: query,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 1,
  });

  const content = response.choices[0]?.message?.content;
  if (content) {
    return JSON.parse(content) as QueryUnderstanding;
  }

  // Fallback: use query as-is
  return {
    productName: query,
    searchQueries: [query],
    isSpecific: false,
  };
}
