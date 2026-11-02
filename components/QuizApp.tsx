"use client";

import { useState } from "react";
import type { Quiz } from "@/lib/quizSchema";
import type { Difficulty, QuizMode } from "@/lib/prompt";
import type { FinishResult } from "@/lib/useQuizClock";
import TopicForm from "./TopicForm";
import QuizBoard from "./QuizBoard";
import NamingBoard from "./NamingBoard";
import RankingBoard from "./RankingBoard";
import ResultsSummary from "./ResultsSummary";

type Phase = "idle" | "generating" | "ready" | "playing" | "finished";

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  difficult: "Difficult",
  hardcore: "Hardcore",
};

const MODE_LABELS: Record<QuizMode, string> = {
  general: "general",
  naming: "naming",
  ranking: "ranking",
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
      <h1 className="text-4xl font-bold mb-2 text-center lowercase text-accent tracking-tight">
        quiz ai
      </h1>
      <p className="text-center text-sm mb-8 text-sub">
        type any topic — we&apos;ll research it and build you a quiz
      </p>

      {(phase === "idle" || phase === "generating") && (
        <TopicForm onGenerate={handleGenerate} generating={phase === "generating"} error={error} />
      )}

      {phase === "ready" && quiz && (
        <div className="text-center space-y-4">
          <p className="text-foreground">
            your quiz on <strong className="text-accent">{quiz.topic}</strong> is ready —{" "}
            <span className="text-sub">
              {minutes} minute
              {minutes === 1 ? "" : "s"}, {quiz.questions.length} questions
              {mode === "general" && `, ${DIFFICULTY_LABELS[difficulty].toLowerCase()} difficulty`}
              {", "}
              {MODE_LABELS[mode]} quiz
            </span>
          </p>
          <button
            onClick={handleStart}
            className="rounded-md bg-accent text-accent-ink px-8 py-3 font-semibold lowercase transition-[filter] hover:brightness-110"
          >
            start quiz
          </button>
        </div>
      )}

      {phase === "playing" && quiz && mode === "naming" && (
        <NamingBoard quiz={quiz} timeLimitSeconds={timeLimitSeconds} onFinish={handleFinish} />
      )}

      {phase === "playing" && quiz && mode === "ranking" && (
        <RankingBoard quiz={quiz} timeLimitSeconds={timeLimitSeconds} onFinish={handleFinish} />
      )}

      {phase === "playing" && quiz && mode === "general" && (
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
