import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { setUserPaid } from "@/lib/db";

// No real billing yet — this just flips the isPaid flag for the logged-in
// user so the paid-only Hardcore tier can be tested/toggled manually.
export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
  }

  setUserPaid(user.id, true);
  return NextResponse.json({ username: user.username, isPaid: true });
}
