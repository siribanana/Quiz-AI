"use client";

import { useState } from "react";
import type { Quiz } from "@/lib/quizSchema";
import type { Difficulty, QuizMode } from "@/lib/prompt";
import TopicForm from "./TopicForm";
import QuizBoard, { type FinishResult } from "./QuizBoard";
import ResultsSummary from "./ResultsSummary";

type Phase = "idle" | "generating" | "ready" | "playing" | "finished";

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  difficult: "Difficult",
  hardcore: "Hardcore",
};

const MODE_LABELS: Record<QuizMode, string> = {
  general: "general",
  naming: "naming/ranking",
};

export default function QuizApp() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(300);
  const [difficulty, setDifficulty] = useState<Difficulty>("difficult");
  const [mode, setMode] = useState<QuizMode>("general");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FinishResult | null>(null);

  async function handleGenerate(
    topic: string,
    minutes: number,
    selectedDifficulty: Difficulty,
    selectedMode: QuizMode
  ) {
    setError(null);
    setTimeLimitSeconds(minutes * 60);
    setDifficulty(selectedDifficulty);
    setMode(selectedMode);
    setPhase("generating");
    try {
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, difficulty: selectedDifficulty, mode: selectedMode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setPhase("idle");
        return;
      }
      setQuiz(data.quiz);
      setPhase("ready");
    } catch {
      setError("Network error — please check your connection and try again.");
      setPhase("idle");
    }
  }

  function handleStart() {
    setPhase("playing");
  }

  function handleFinish(r: FinishResult) {
    setResult(r);
    setPhase("finished");
  }

  function handleNewQuiz() {
    setQuiz(null);
    setResult(null);
    setError(null);
    setPhase("idle");
  }

  const minutes = Math.round(timeLimitSeconds / 60);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-10 sm:py-16">
      <h1 className="text-3xl font-bold mb-2 text-center">Quiz AI</h1>
      <p className="text-center text-sm mb-8 opacity-70">
        Type any topic — we&apos;ll research it and build you a timed fill-in-the-blank quiz.
      </p>

      {(phase === "idle" || phase === "generating") && (
        <TopicForm onGenerate={handleGenerate} generating={phase === "generating"} error={error} />
      )}

      {phase === "ready" && quiz && (
        <div className="text-center space-y-4">
          <p>
            Your quiz on <strong>{quiz.topic}</strong> is ready — {minutes} minute
            {minutes === 1 ? "" : "s"}, {quiz.questions.length} questions,{" "}
            {DIFFICULTY_LABELS[difficulty].toLowerCase()} difficulty, {MODE_LABELS[mode]} quiz.
          </p>
          <button
            onClick={handleStart}
            className="rounded-full bg-foreground text-background px-8 py-3 font-medium"
          >
            Start Quiz
          </button>
        </div>
      )}

      {phase === "playing" && quiz && (
        <QuizBoard quiz={quiz} timeLimitSeconds={timeLimitSeconds} onFinish={handleFinish} />
      )}

      {phase === "finished" && quiz && result && (
        <ResultsSummary
          quiz={quiz}
          result={result}
          timeLimitSeconds={timeLimitSeconds}
          onNewQuiz={handleNewQuiz}
        />
      )}
    </div>
  );
}
