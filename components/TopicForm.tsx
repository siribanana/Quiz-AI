"use client";

import { useState, type FormEvent } from "react";
import type { Difficulty, QuizMode } from "@/lib/prompt";

interface Props {
  onGenerate: (topic: string, minutes: number, difficulty: Difficulty, mode: QuizMode) => void;
  generating: boolean;
  error: string | null;
}

const TIME_OPTIONS = [2, 3, 5, 10];
const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "difficult", label: "Difficult" },
  { value: "hardcore", label: "Hardcore" },
];
const MODE_OPTIONS: { value: QuizMode; label: string }[] = [
  { value: "general", label: "General" },
  { value: "naming", label: "Naming" },
  { value: "ranking", label: "Ranking" },
];

export default function TopicForm({ onGenerate, generating, error }: Props) {
  const [topic, setTopic] = useState("");
  const [minutes, setMinutes] = useState(5);
  const [difficulty, setDifficulty] = useState<Difficulty>("difficult");
  const [mode, setMode] = useState<QuizMode>("general");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = topic.trim();
    if (trimmed.length < 3) return;
    onGenerate(trimmed, minutes, difficulty, mode);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        value={topic}
        onChange={(e) => setTopic(e.target.value.slice(0, 300))}
        placeholder="e.g. the 10 most visited attractions in the world"
        rows={3}
        disabled={generating}
        className="w-full rounded-lg border border-black/10 dark:border-white/15 p-3 bg-transparent outline-none focus:border-foreground disabled:opacity-60"
      />
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <label className="text-sm opacity-70" htmlFor="minutes">
            Time limit:
          </label>
          <select
            id="minutes"
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            disabled={generating}
            className="rounded-md border border-black/10 dark:border-white/15 bg-transparent px-2 py-1 disabled:opacity-60"
          >
            {TIME_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m} minutes
              </option>
            ))}
          </select>
        </div>
        {mode === "general" && (
          <div className="flex items-center gap-3">
            <span className="text-sm opacity-70">Difficulty:</span>
            <div className="flex rounded-md border border-black/10 dark:border-white/15 overflow-hidden">
              {DIFFICULTY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={generating}
                  onClick={() => setDifficulty(opt.value)}
                  aria-pressed={difficulty === opt.value}
                  className={`px-3 py-1 text-sm disabled:opacity-60 ${
                    difficulty === opt.value
                      ? "bg-foreground text-background"
                      : "bg-transparent hover:bg-black/5 dark:hover:bg-white/10"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex items-center gap-3">
          <span className="text-sm opacity-70">Quiz type:</span>
          <div className="flex rounded-md border border-black/10 dark:border-white/15 overflow-hidden">
            {MODE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={generating}
                onClick={() => setMode(opt.value)}
                aria-pressed={mode === opt.value}
                className={`px-3 py-1 text-sm disabled:opacity-60 ${
                  mode === opt.value
                    ? "bg-foreground text-background"
                    : "bg-transparent hover:bg-black/5 dark:hover:bg-white/10"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={generating || topic.trim().length < 3}
        className="w-full rounded-full bg-foreground text-background py-3 font-medium disabled:opacity-50"
      >
        {generating
          ? "Researching your topic — this can take up to a minute…"
          : "Generate Quiz"}
      </button>
    </form>
  );
}
