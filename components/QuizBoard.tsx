"use client";

import { useEffect, useRef, useState } from "react";
import type { Quiz } from "@/lib/quizSchema";
import { checkAnswer } from "@/lib/answerMatching";
import QuestionSlot, { type SlotStatus } from "./QuestionSlot";
import Timer from "./Timer";

interface SlotState {
  value: string;
  status: SlotStatus;
  wrongCount: number;
}

export interface FinishResult {
  score: number;
  total: number;
  timeRemainingSeconds: number;
  reason: "allCorrect" | "timeUp" | "gaveUp";
  slotStatuses: SlotStatus[];
}

interface Props {
  quiz: Quiz;
  timeLimitSeconds: number;
  onFinish: (result: FinishResult) => void;
}

export default function QuizBoard({ quiz, timeLimitSeconds, onFinish }: Props) {
  const [slots, setSlots] = useState<SlotState[]>(() =>
    quiz.questions.map(() => ({ value: "", status: "unanswered" as SlotStatus, wrongCount: 0 }))
  );
  const [remainingSeconds, setRemainingSeconds] = useState(timeLimitSeconds);
  const finishedRef = useRef(false);

  const score = slots.filter((s) => s.status === "correct").length;

  function finish(reason: "allCorrect" | "timeUp" | "gaveUp") {
    if (finishedRef.current) return;
    finishedRef.current = true;

    let finalSlots = slots;
    if (reason === "timeUp" || reason === "gaveUp") {
      finalSlots = slots.map((s) =>
        s.status === "unanswered" ? { ...s, status: "revealed" as SlotStatus } : s
      );
      setSlots(finalSlots);
    }

    const finalScore = finalSlots.filter((s) => s.status === "correct").length;
    onFinish({
      score: finalScore,
      total: quiz.questions.length,
      timeRemainingSeconds: remainingSeconds,
      reason,
      slotStatuses: finalSlots.map((s) => s.status),
    });
  }

  useEffect(() => {
    if (finishedRef.current) return;
    if (remainingSeconds <= 0) {
      const t = setTimeout(() => finish("timeUp"), 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setRemainingSeconds((r) => r - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds]);

  useEffect(() => {
    if (finishedRef.current || slots.length === 0) return;
    if (slots.every((s) => s.status === "correct")) {
      const t = setTimeout(() => finish("allCorrect"), 0);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots]);

  function handleGiveUp() {
    if (finishedRef.current) return;
    const confirmed = window.confirm(
      "Give up? You'll jump straight to the results with remaining answers revealed."
    );
    if (confirmed) finish("gaveUp");
  }

  function handleChange(i: number, value: string) {
    setSlots((prev) => prev.map((s, idx) => (idx === i ? { ...s, value } : s)));
  }

  function handleSubmit(i: number) {
    setSlots((prev) =>
      prev.map((s, idx) => {
        if (idx !== i || s.status !== "unanswered") return s;
        const question = quiz.questions[i];
        const correct = checkAnswer(s.value, question.answer, question.acceptableAnswers);
        if (correct) {
          return { ...s, status: "correct" as SlotStatus };
        }
        return { ...s, wrongCount: s.wrongCount + 1 };
      })
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="font-medium">
          {score} / {quiz.questions.length} correct
        </p>
        <Timer remainingSeconds={remainingSeconds} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {quiz.questions.map((q, i) => (
          <QuestionSlot
            key={q.id}
            index={i}
            prompt={q.prompt}
            answer={q.answer}
            status={slots[i].status}
            value={slots[i].value}
            wrongPulse={slots[i].wrongCount}
            onChange={(v) => handleChange(i, v)}
            onSubmit={() => handleSubmit(i)}
          />
        ))}
      </div>
      <div className="mt-6 text-center">
        <button
          onClick={handleGiveUp}
          className="text-sm text-zinc-500 hover:text-red-600 underline underline-offset-2"
        >
          Give up
        </button>
      </div>
    </div>
  );
}
