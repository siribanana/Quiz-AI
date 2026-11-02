"use client";

import { useRef, useState, type FormEvent } from "react";
import type { Quiz } from "@/lib/quizSchema";
import { checkAnswer } from "@/lib/answerMatching";
import { useQuizClock, type FinishResult, type SlotStatus } from "@/lib/useQuizClock";
import Timer from "./Timer";
import ConfirmDialog from "./ConfirmDialog";

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

  const { remainingSeconds, confirmingGiveUp, requestGiveUp, confirmGiveUp, cancelGiveUp } = useQuizClock({
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
        <p className="text-sm">
          <span className="text-sub lowercase">score </span>
          <span className="font-mono text-xl text-foreground">
            {score}/{quiz.questions.length}
          </span>
        </p>
        <Timer remainingSeconds={remainingSeconds} />
      </div>

      <h2 className="text-center font-semibold mb-4 text-foreground">{quiz.topic}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
        {quiz.questions.map((q, i) => {
          const status = slotStatuses[i];
          const bgClass =
            status === "correct" ? "bg-correct/10" : status === "revealed" ? "bg-sub-alt/40" : "bg-background-alt";
          return (
            <div key={q.id} className={`flex items-baseline gap-2 rounded-md px-3 py-2 transition-colors ${bgClass}`}>
              <span className="text-sm font-mono text-accent w-6 shrink-0">{i + 1}.</span>
              {status === "unanswered" ? (
                <span className="flex-1 border-b border-dotted border-sub opacity-60">&nbsp;</span>
              ) : (
                <span className={`flex-1 font-medium ${status === "correct" ? "text-correct" : "text-sub"}`}>
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
            className={`pointer-events-none absolute inset-0 rounded-md ${
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
          placeholder="type any answer…"
          className="relative w-full rounded-md border border-sub-alt bg-background-alt p-3 font-mono text-foreground placeholder:text-sub outline-none focus:border-accent disabled:opacity-50 transition-colors"
        />
      </form>

      <div className="text-center">
        <button
          onClick={requestGiveUp}
          className="text-sm lowercase text-sub hover:text-accent underline-offset-2 hover:underline transition-colors"
        >
          give up
        </button>
      </div>
      <ConfirmDialog
        open={confirmingGiveUp}
        message="Give up? You'll jump straight to the results with remaining answers revealed."
        confirmLabel="give up"
        cancelLabel="cancel"
        onConfirm={confirmGiveUp}
        onCancel={cancelGiveUp}
      />
    </div>
  );
}
