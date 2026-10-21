"use client";

import { useState } from "react";
import type { Quiz } from "@/lib/quizSchema";
import { useQuizClock, type FinishResult, type SlotStatus } from "@/lib/useQuizClock";
import Timer from "./Timer";

interface Props {
  quiz: Quiz;
  timeLimitSeconds: number;
  onFinish: (result: FinishResult) => void;
}

interface RowState {
  value: string;
  status: SlotStatus;
  wrongCount: number;
}

function shuffleOnce(length: number): number[] {
  const indices = Array.from({ length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}

// Shuffles, and explicitly re-rolls if it happens to land back on rank order
// (identity permutation) — the whole point is that the list must never be
// presented already in rank order, so chance alone isn't good enough here.
function shuffledIndices(length: number): number[] {
  if (length <= 1) return Array.from({ length }, (_, i) => i);
  let indices = shuffleOnce(length);
  while (indices.every((v, i) => v === i)) {
    indices = shuffleOnce(length);
  }
  return indices;
}

function parseRank(value: string): number | null {
  const match = value.match(/\d+/);
  if (!match) return null;
  return parseInt(match[0], 10);
}

export default function RankingBoard({ quiz, timeLimitSeconds, onFinish }: Props) {
  const total = quiz.questions.length;
  const [displayOrder] = useState<number[]>(() => shuffledIndices(total));
  const [rows, setRows] = useState<RowState[]>(() =>
    quiz.questions.map(() => ({ value: "", status: "unanswered" as SlotStatus, wrongCount: 0 }))
  );

  const score = rows.filter((r) => r.status === "correct").length;
  const allCorrect = total > 0 && score === total;

  const { remainingSeconds, giveUp } = useQuizClock({
    timeLimitSeconds,
    allCorrect,
    onFinish: (reason, timeRemainingSeconds) => {
      let finalRows = rows;
      if (reason !== "allCorrect") {
        finalRows = rows.map((r) =>
          r.status === "unanswered" ? { ...r, status: "revealed" as SlotStatus } : r
        );
        setRows(finalRows);
      }
      const finalScore = finalRows.filter((r) => r.status === "correct").length;
      onFinish({
        score: finalScore,
        total,
        timeRemainingSeconds,
        reason,
        slotStatuses: finalRows.map((r) => r.status),
      });
    },
  });

  function handleChange(originalIndex: number, value: string) {
    setRows((prev) => prev.map((r, idx) => (idx === originalIndex ? { ...r, value } : r)));
  }

  function handleSubmit(originalIndex: number) {
    setRows((prev) =>
      prev.map((r, idx) => {
        if (idx !== originalIndex || r.status !== "unanswered") return r;
        const guess = parseRank(r.value);
        const trueRank = originalIndex + 1;
        if (guess === trueRank) {
          return { ...r, status: "correct" as SlotStatus };
        }
        return { ...r, wrongCount: r.wrongCount + 1 };
      })
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm">
          <span className="text-sub lowercase">score </span>
          <span className="font-mono text-xl text-foreground">
            {score}/{total}
          </span>
        </p>
        <Timer remainingSeconds={remainingSeconds} />
      </div>

      <h2 className="text-center font-semibold mb-1 text-foreground">{quiz.topic}</h2>
      <p className="text-center text-sm text-sub mb-4 lowercase">
        assign each item its correct rank (1–{total})
      </p>

      <div className="space-y-2">
        {displayOrder.map((originalIndex) => {
          const q = quiz.questions[originalIndex];
          const row = rows[originalIndex];
          const trueRank = originalIndex + 1;
          const locked = row.status !== "unanswered";
          const bgClass =
            row.status === "correct"
              ? "bg-correct/10"
              : row.status === "revealed"
                ? "bg-sub-alt/40"
                : "bg-background-alt";

          return (
            <div key={q.id} className={`relative flex items-center gap-3 rounded-md p-3 transition-colors ${bgClass}`}>
              {!locked && row.wrongCount > 0 && (
                <span
                  key={row.wrongCount}
                  aria-hidden
                  className="shake-flash pointer-events-none absolute inset-0 rounded-md"
                />
              )}
              <span className="flex-1 font-medium text-foreground">{q.answer}</span>
              {locked ? (
                <span
                  className={`text-sm font-semibold font-mono ${
                    row.status === "correct" ? "text-correct" : "text-sub"
                  }`}
                >
                  #{trueRank}
                  {row.status === "revealed" && (
                    <span className="ml-2 text-xs font-normal lowercase font-sans">(time&apos;s up)</span>
                  )}
                </span>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit(originalIndex);
                  }}
                  className="w-24 shrink-0"
                >
                  <input
                    value={row.value}
                    onChange={(e) => handleChange(originalIndex, e.target.value)}
                    placeholder={`1–${total}`}
                    inputMode="numeric"
                    autoComplete="off"
                    className="w-full rounded-md border border-sub-alt bg-background px-2 py-1.5 text-center font-mono text-foreground placeholder:text-sub outline-none focus:border-accent transition-colors"
                  />
                </form>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={giveUp}
          className="text-sm lowercase text-sub hover:text-error underline-offset-2 hover:underline transition-colors"
        >
          give up
        </button>
      </div>
    </div>
  );
}
