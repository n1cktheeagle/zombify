import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const preferredRegion = "auto";

export async function GET() {
  return NextResponse.json({ ok: true, hasKey: Boolean(process.env.OPENAI_API_KEY), model: process.env.OPENAI_STRICT_FEEDBACK_MODEL || "gpt-5" }, { status: 200 });
}


