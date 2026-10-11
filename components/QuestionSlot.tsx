"use client";

export type SlotStatus = "unanswered" | "correct" | "revealed";

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
  const borderClass =
    status === "correct"
      ? "border-green-500 bg-green-500/10"
      : status === "revealed"
        ? "border-zinc-400 bg-zinc-500/10"
        : "border-black/10 dark:border-white/15";

  return (
    <div className={`relative rounded-lg border p-3 transition-colors ${borderClass}`}>
      {status === "unanswered" && wrongPulse > 0 && (
        <span key={wrongPulse} aria-hidden className="shake-flash pointer-events-none absolute inset-0 rounded-lg" />
      )}
      <p className="text-sm mb-2 opacity-80">
        {index + 1}. {prompt}
      </p>
      {locked ? (
        <p
          className={`font-semibold ${
            status === "correct" ? "text-green-600 dark:text-green-400" : "text-zinc-500"
          }`}
        >
          {answer}
          {status === "revealed" && (
            <span className="ml-2 text-xs font-normal opacity-70">(time&apos;s up)</span>
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
            placeholder="Your answer"
            autoComplete="off"
            className="w-full rounded-md border border-black/10 dark:border-white/15 bg-transparent px-2 py-1.5 outline-none focus:border-foreground"
          />
        </form>
      )}
    </div>
  );
}
