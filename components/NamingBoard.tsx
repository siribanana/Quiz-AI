"use client";

import { useRef, useState, type FormEvent } from "react";
import type { Quiz } from "@/lib/quizSchema";
import { checkAnswer } from "@/lib/answerMatching";
import { useQuizClock, type FinishResult, type SlotStatus } from "@/lib/useQuizClock";
import Timer from "./Timer";

interface Props {
  quiz: Quiz;
  timeLimitSeconds: number;
  onFinish: (result: FinishResult) => void;
}

export default function NamingBoard({ quiz, timeLimitSeconds, onFinish }: Props) {
  const [slotStatuses, setSlotStatuses] = useState<SlotStatus[]>(() =>
    quiz.questions.map(() => "unanswered" as SlotStatus)
  );
  const [inputValue, setInputValue] = useState("");
  const [attemptSeq, setAttemptSeq] = useState(0);
  const [lastResult, setLastResult] = useState<"correct" | "wrong">("wrong");
  const inputRef = useRef<HTMLInputElement>(null);

  const score = slotStatuses.filter((s) => s === "correct").length;
  const allCorrect = slotStatuses.length > 0 && score === slotStatuses.length;
  const remainingCount = slotStatuses.filter((s) => s === "unanswered").length;

  const { remainingSeconds, giveUp } = useQuizClock({
    timeLimitSeconds,
    allCorrect,
    onFinish: (reason, timeRemainingSeconds) => {
      let finalStatuses = slotStatuses;
      if (reason !== "allCorrect") {
        finalStatuses = slotStatuses.map((s) => (s === "unanswered" ? "revealed" : s));
        setSlotStatuses(finalStatuses);
      }
      const finalScore = finalStatuses.filter((s) => s === "correct").length;
      onFinish({
        score: finalScore,
        total: quiz.questions.length,
        timeRemainingSeconds,
        reason,
        slotStatuses: finalStatuses,
      });
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || remainingCount === 0) return;

    const matchIndex = quiz.questions.findIndex(
      (q, i) => slotStatuses[i] === "unanswered" && checkAnswer(trimmed, q.answer, q.acceptableAnswers)
    );

    if (matchIndex !== -1) {
      setSlotStatuses((prev) => prev.map((s, i) => (i === matchIndex ? "correct" : s)));
      setLastResult("correct");
    } else {
      setLastResult("wrong");
    }
    setAttemptSeq((n) => n + 1);
    setInputValue("");
    inputRef.current?.focus();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="font-medium">
          {score} / {quiz.questions.length} correct
        </p>
        <Timer remainingSeconds={remainingSeconds} />
      </div>

      <h2 className="text-center font-semibold mb-4">{quiz.topic}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
        {quiz.questions.map((q, i) => {
          const status = slotStatuses[i];
          return (
            <div
              key={q.id}
              className={`flex items-baseline gap-2 rounded-md border px-3 py-2 ${
                status === "correct"
                  ? "border-green-500 bg-green-500/10"
                  : status === "revealed"
                    ? "border-zinc-400 bg-zinc-500/10"
                    : "border-black/10 dark:border-white/15"
              }`}
            >
              <span className="text-sm opacity-60 w-6 shrink-0">{i + 1}.</span>
              {status === "unanswered" ? (
                <span className="flex-1 border-b border-dotted border-current opacity-40">
                  &nbsp;
                </span>
              ) : (
                <span
                  className={`flex-1 font-medium ${
                    status === "correct" ? "text-green-600 dark:text-green-400" : "text-zinc-500"
                  }`}
                >
                  {q.answer}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="relative mb-4">
        {attemptSeq > 0 && remainingCount >= 0 && (
          <span
            key={attemptSeq}
            aria-hidden
            className={`pointer-events-none absolute inset-0 rounded-lg ${
              lastResult === "correct" ? "flash-correct" : "shake-flash"
            }`}
          />
        )}
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={remainingCount === 0}
          autoFocus
          autoComplete="off"
          placeholder="Type any answer…"
          className="relative w-full rounded-lg border border-black/10 dark:border-white/15 bg-transparent p-3 outline-none focus:border-foreground disabled:opacity-60"
        />
      </form>

      <div className="text-center">
        <button
          onClick={giveUp}
          className="text-sm text-zinc-500 hover:text-red-600 underline underline-offset-2"
        >
          Give up
        </button>
      </div>
    </div>
  );
}
