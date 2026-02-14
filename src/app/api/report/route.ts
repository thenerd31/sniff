import { NextRequest, NextResponse } from "next/server";
import { generateReport } from "@/lib/reportGenerator";
import type { ReportInput } from "@/lib/reportGenerator";

export async function POST(req: NextRequest) {
  try {
    const input: ReportInput = await req.json();

    if (!input.url || !Array.isArray(input.cards)) {
      return NextResponse.json(
        { error: "Missing required fields: url, cards" },
        { status: 400 }
      );
    }

    const report = generateReport({
      url: input.url,
      cards: input.cards,
      connections: input.connections || [],
      threatScore: input.threatScore ?? 0,
      savingsAmount: input.savingsAmount,
    });

    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
