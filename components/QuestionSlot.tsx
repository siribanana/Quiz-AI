"use client";

import type { SlotStatus } from "@/lib/useQuizClock";

interface Props {
  index: number;
  prompt: string;
  answer: string;
  status: SlotStatus;
  value: string;
  wrongPulse: number;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export default function QuestionSlot({
  index,
  prompt,
  answer,
  status,
  value,
  wrongPulse,
  onChange,
  onSubmit,
}: Props) {
  const locked = status !== "unanswered";
  const bgClass =
    status === "correct" ? "bg-correct/10" : status === "revealed" ? "bg-sub-alt/40" : "bg-background-alt";

  return (
    <div className={`relative rounded-md p-3 transition-colors ${bgClass}`}>
      {status === "unanswered" && wrongPulse > 0 && (
        <span key={wrongPulse} aria-hidden className="shake-flash pointer-events-none absolute inset-0 rounded-md" />
      )}
      <p className="text-sm mb-2">
        <span className="font-mono text-accent">{index + 1}.</span>{" "}
        <span className="text-foreground">{prompt}</span>
      </p>
      {locked ? (
        <p className={`font-semibold ${status === "correct" ? "text-correct" : "text-sub"}`}>
          {answer}
          {status === "revealed" && (
            <span className="ml-2 text-xs font-normal lowercase text-sub">(time&apos;s up)</span>
          )}
        </p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="your answer"
            autoComplete="off"
            className="w-full rounded-md border border-sub-alt bg-background px-2 py-1.5 font-mono text-foreground placeholder:text-sub outline-none focus:border-accent transition-colors"
          />
        </form>
      )}
    </div>
  );
}
