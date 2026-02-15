import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI();

// ── POST /api/clarify ────────────────────────────────────────────────────
// Takes a raw shopping query and decides:
//   - ready: true  → query is specific enough, go straight to /api/search
//   - ready: false → query is vague, return refinement options
//
// Input:  { query: string, image?: string }
// Output: { ready: true, query: string }
//       | { ready: false, refinements: Refinement[], productName: string }

interface Refinement {
  label: string;      // "Type", "Budget", "Size", etc.
  options: string[];   // ["Winter Puffer", "Leather", "Rain", "Denim"]
}

interface ClarifyResponse {
  ready: boolean;
  query?: string;
  productName?: string;
  refinements?: Refinement[];
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { query, image } = body as { query?: string; image?: string };

  if (!query && !image) {
    return NextResponse.json(
      { error: "Provide query or image" },
      { status: 400 },
    );
  }

  // Image input → always ready (GPT-4o Vision will identify it)
  if (image) {
    return NextResponse.json({ ready: true, query: query || "" });
  }

  const q = (query || "").trim();

  // Very short or single-word queries are almost always vague
  const wordCount = q.split(/\s+/).length;

  // Specific brand + model → ready
  const specificPattern = /\b(apple|samsung|sony|nike|adidas|bose|lg|dell|hp|lenovo|asus|google|airpods|iphone|ipad|macbook|galaxy|pixel|dyson|kitchenaid|lego|nintendo|playstation|xbox)\b/i;
  if (specificPattern.test(q) && wordCount >= 3) {
    return NextResponse.json({ ready: true, query: q });
  }

  // Queries with enough detail (4+ words with descriptors) → ready
  if (wordCount >= 4) {
    return NextResponse.json({ ready: true, query: q });
  }

  // For vague queries, ask the LLM to generate refinement options
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You help shoppers refine vague product searches. The user typed a short, ambiguous shopping query. Generate 2-3 refinement dimensions to narrow it down.

Return JSON:
{
  "productName": "what the user is looking for",
  "refinements": [
    {
      "label": "Type",
      "options": ["Option A", "Option B", "Option C", "Option D"]
    },
    {
      "label": "Budget",
      "options": ["Under $50", "Under $100", "Under $200", "Any price"]
    }
  ]
}

Rules:
- Each refinement should have 3-5 options
- First refinement should be the most important disambiguation (type/style/category)
- Only include "Budget" if the product category has a wide price range
- Options should be concise (1-3 words each)
- Don't include a refinement if the query already specifies it
- Max 3 refinements — keep it quick, not a quiz
- Options should be mutually exclusive choices, not features`,
        },
        {
          role: "user",
          content: q,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      // LLM failed — just let it through
      return NextResponse.json({ ready: true, query: q });
    }

    const result = JSON.parse(content) as {
      productName: string;
      refinements: Refinement[];
    };

    // If the LLM only returned 0-1 refinements, the query is probably fine
    if (!result.refinements || result.refinements.length === 0) {
      return NextResponse.json({ ready: true, query: q });
    }

    return NextResponse.json({
      ready: false,
      productName: result.productName,
      refinements: result.refinements,
    } satisfies ClarifyResponse);
  } catch {
    // On any error, just let the query through
    return NextResponse.json({ ready: true, query: q });
  }
}
