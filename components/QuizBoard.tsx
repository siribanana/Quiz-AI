"use client";

import { useState } from "react";
import type { Quiz } from "@/lib/quizSchema";
import { checkAnswer } from "@/lib/answerMatching";
import { useQuizClock, type FinishResult, type SlotStatus } from "@/lib/useQuizClock";
import QuestionSlot from "./QuestionSlot";
import Timer from "./Timer";
import ConfirmDialog from "./ConfirmDialog";

interface SlotState {
  value: string;
  status: SlotStatus;
  wrongCount: number;
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

  const score = slots.filter((s) => s.status === "correct").length;
  const allCorrect = slots.length > 0 && score === slots.length;

  const { remainingSeconds, confirmingGiveUp, requestGiveUp, confirmGiveUp, cancelGiveUp } = useQuizClock({
    timeLimitSeconds,
    allCorrect,
    onFinish: (reason, timeRemainingSeconds) => {
      let finalSlots = slots;
      if (reason !== "allCorrect") {
        finalSlots = slots.map((s) =>
          s.status === "unanswered" ? { ...s, status: "revealed" as SlotStatus } : s
        );
        setSlots(finalSlots);
      }
      const finalScore = finalSlots.filter((s) => s.status === "correct").length;
      onFinish({
        score: finalScore,
        total: quiz.questions.length,
        timeRemainingSeconds,
        reason,
        slotStatuses: finalSlots.map((s) => s.status),
      });
    },
  });

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
        <p className="text-sm">
          <span className="text-sub lowercase">score </span>
          <span className="font-mono text-xl text-foreground">
            {score}/{quiz.questions.length}
          </span>
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
