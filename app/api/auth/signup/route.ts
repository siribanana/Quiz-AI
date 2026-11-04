import { NextRequest, NextResponse } from "next/server";
import { signUp, isValidUsername } from "@/lib/auth";
import { findUserByUsername } from "@/lib/db";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { username, password } = body as { username?: unknown; password?: unknown };

  if (typeof username !== "string" || !isValidUsername(username)) {
    return NextResponse.json(
      { error: "Username must be 3-20 characters: letters, numbers, underscore, or hyphen." },
      { status: 400 }
    );
  }
  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  if (findUserByUsername(username)) {
    return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
  }

  const user = await signUp(username, password);
  return NextResponse.json({ username: user.username, isPaid: !!user.is_paid });
}
