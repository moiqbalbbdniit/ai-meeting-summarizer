// app/api/summarize/route.ts
import { NextResponse } from "next/server";
import { summarizeSchema, summarizeWithLLM } from "@/lib/ai";

export const runtime = "edge"; // fast & cheap on Vercel

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = summarizeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const summary = await summarizeWithLLM(parsed.data);
    return NextResponse.json({ summary });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unexpected error" }, { status: 500 });
  }
}
