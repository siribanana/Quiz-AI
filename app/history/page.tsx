import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getResultsForUser } from "@/lib/db";

// Reads the session cookie per-request (who's logged in), so this page can't
// be statically prerendered.
export const instant = false;

function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

const REASON_LABELS: Record<string, string> = {
  allCorrect: "finished early",
  timeUp: "time's up",
  gaveUp: "gave up",
};

export default async function HistoryPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="w-full max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-foreground mb-4">sign in to see your quiz history</p>
        <Link href="/" className="text-accent lowercase hover:underline">
          back to quiz ai
        </Link>
      </div>
    );
  }

  const results = getResultsForUser(user.id);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-10 sm:py-16">
      <h1 className="text-2xl font-bold mb-1 text-foreground lowercase">
        {user.username}&apos;s history
      </h1>
      <p className="text-sm text-sub mb-6 lowercase">{results.length} quizzes played</p>

      {results.length === 0 ? (
        <p className="text-sub">no quizzes played yet.</p>
      ) : (
        <div className="space-y-2">
          {results.map((r) => (
            <div key={r.id} className="rounded-md bg-background-alt p-3">
              <div className="flex items-start justify-between gap-4">
                <p className="font-medium text-foreground">{r.topic}</p>
                <span className="shrink-0 font-mono text-sm text-foreground">
                  {r.score}/{r.total}
                </span>
              </div>
              <p className="text-sm text-sub lowercase">
                {r.mode}
                {r.difficulty ? ` · ${r.difficulty}` : ""} · {REASON_LABELS[r.reason] ?? r.reason} · used{" "}
                {formatDuration(r.time_limit_seconds - r.time_remaining_seconds)} ·{" "}
                {new Date(r.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 text-center">
        <Link href="/" className="text-accent lowercase hover:underline">
          back to quiz ai
        </Link>
      </div>
    </div>
  );
}
