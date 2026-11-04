import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { saveQuizResult } from "@/lib/db";

interface ResultPayload {
  topic: string;
  mode: string;
  difficulty: string | null;
  questionCount: number;
  score: number;
  total: number;
  reason: string;
  timeLimitSeconds: number;
  timeRemainingSeconds: number;
}

function isValidPayload(body: unknown): body is ResultPayload {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.topic === "string" &&
    typeof b.mode === "string" &&
    (b.difficulty === null || typeof b.difficulty === "string") &&
    typeof b.questionCount === "number" &&
    typeof b.score === "number" &&
    typeof b.total === "number" &&
    typeof b.reason === "string" &&
    typeof b.timeLimitSeconds === "number" &&
    typeof b.timeRemainingSeconds === "number"
  );
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    // Not signed in — results just aren't saved. Not an error for the client.
    return NextResponse.json({ saved: false });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!isValidPayload(body)) {
    return NextResponse.json({ error: "Malformed result payload." }, { status: 400 });
  }

  saveQuizResult({
    user_id: user.id,
    topic: body.topic,
    mode: body.mode,
    difficulty: body.difficulty,
    question_count: body.questionCount,
    score: body.score,
    total: body.total,
    reason: body.reason,
    time_limit_seconds: body.timeLimitSeconds,
    time_remaining_seconds: body.timeRemainingSeconds,
  });

  return NextResponse.json({ saved: true });
}
