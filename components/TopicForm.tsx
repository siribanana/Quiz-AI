"use client";

import { useState, type FormEvent } from "react";
import type { Difficulty, QuizMode } from "@/lib/prompt";
import { EXAMPLE_TOPICS, pickRandomTopicIndex } from "@/lib/exampleTopics";

interface Props {
  onGenerate: (topic: string, minutes: number, difficulty: Difficulty, mode: QuizMode) => void;
  generating: boolean;
  error: string | null;
  canUseHardcore: boolean;
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

export default function TopicForm({ onGenerate, generating, error, canUseHardcore }: Props) {
  const [topic, setTopic] = useState("");
  const [minutes, setMinutes] = useState(5);
  const [difficulty, setDifficulty] = useState<Difficulty>("difficult");
  const [mode, setMode] = useState<QuizMode>("general");
  const [lastTopicIndex, setLastTopicIndex] = useState<number | null>(null);

  const effectiveDifficulty = difficulty === "hardcore" && !canUseHardcore ? "difficult" : difficulty;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = topic.trim();
    if (trimmed.length < 3) return;
    onGenerate(trimmed, minutes, effectiveDifficulty, mode);
  }

  function handleRandomTopic() {
    const index = pickRandomTopicIndex(lastTopicIndex);
    setLastTopicIndex(index);
    setTopic(EXAMPLE_TOPICS[index]);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        value={topic}
        onChange={(e) => setTopic(e.target.value.slice(0, 300))}
        placeholder="e.g. the 10 most visited attractions in the world"
        rows={3}
        disabled={generating}
        className="w-full rounded-md border border-sub-alt bg-background-alt p-3 text-foreground placeholder:text-sub outline-none focus:border-accent disabled:opacity-50 transition-colors"
      />
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleRandomTopic}
          disabled={generating}
          className="text-sm text-sub lowercase transition-colors hover:text-accent disabled:opacity-50"
        >
          lacking inspiration? · random topic
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <label className="text-sm text-sub lowercase" htmlFor="minutes">
            time limit
          </label>
          <select
            id="minutes"
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            disabled={generating}
            className="rounded-md border border-sub-alt bg-background-alt px-2 py-1 text-foreground disabled:opacity-50"
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
            <span className="text-sm text-sub lowercase">difficulty</span>
            <div className="flex rounded-md bg-background-alt overflow-hidden">
              {DIFFICULTY_OPTIONS.map((opt) => {
                const locked = opt.value === "hardcore" && !canUseHardcore;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={generating || locked}
                    onClick={() => setDifficulty(opt.value)}
                    aria-pressed={effectiveDifficulty === opt.value}
                    title={locked ? "paid accounts only — sign up and upgrade below" : undefined}
                    className={`px-3 py-1 text-sm lowercase transition-colors disabled:opacity-50 ${
                      effectiveDifficulty === opt.value
                        ? "bg-accent text-accent-ink font-medium"
                        : "text-sub hover:text-foreground"
                    }`}
                  >
                    {opt.label}
                    {locked && " 🔒"}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div className="flex items-center gap-3">
          <span className="text-sm text-sub lowercase">quiz type</span>
          <div className="flex rounded-md bg-background-alt overflow-hidden">
            {MODE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={generating}
                onClick={() => setMode(opt.value)}
                aria-pressed={mode === opt.value}
                className={`px-3 py-1 text-sm lowercase transition-colors disabled:opacity-50 ${
                  mode === opt.value
                    ? "bg-accent text-accent-ink font-medium"
                    : "text-sub hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
      <button
        type="submit"
        disabled={generating || topic.trim().length < 3}
        className="w-full rounded-md bg-accent text-accent-ink py-3 font-semibold lowercase transition-[filter] hover:brightness-110 disabled:bg-sub-alt disabled:text-sub disabled:hover:brightness-100"
      >
        {generating
          ? "researching your topic — this can take up to a minute…"
          : "generate quiz"}
      </button>
    </form>
  );
}
