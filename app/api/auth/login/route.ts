import { NextRequest, NextResponse } from "next/server";
import { logIn } from "@/lib/auth";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { username, password } = body as { username?: unknown; password?: unknown };

  if (typeof username !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
  }

  const user = await logIn(username, password);
  if (!user) {
    return NextResponse.json({ error: "Incorrect username or password." }, { status: 401 });
  }

  return NextResponse.json({ username: user.username, isPaid: !!user.is_paid });
}
