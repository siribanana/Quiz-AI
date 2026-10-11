import type { Quiz } from "@/lib/quizSchema";
import type { FinishResult } from "./QuizBoard";

interface Props {
  quiz: Quiz;
  result: FinishResult;
  timeLimitSeconds: number;
  onNewQuiz: () => void;
}

function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

export default function ResultsSummary({ quiz, result, timeLimitSeconds, onNewQuiz }: Props) {
  const timeUsed = timeLimitSeconds - result.timeRemainingSeconds;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold">
          {result.score} / {result.total} correct
        </h2>
        <p className="opacity-70 text-sm">
          {result.reason === "allCorrect"
            ? `Finished with ${formatDuration(result.timeRemainingSeconds)} to spare!`
            : result.reason === "gaveUp"
              ? `You gave up — used ${formatDuration(timeUsed)}.`
              : `Time's up — used ${formatDuration(timeUsed)}.`}
        </p>
      </div>
      <div className="space-y-2">
        {quiz.questions.map((q, i) => (
          <div
            key={q.id}
            className="flex items-start justify-between gap-4 rounded-lg border border-black/10 dark:border-white/15 p-3"
          >
            <div>
              <p className="text-sm opacity-80">{q.prompt}</p>
              <p className="font-medium">{q.answer}</p>
            </div>
            <span
              className={
                result.slotStatuses[i] === "correct"
                  ? "text-green-600 dark:text-green-400 shrink-0"
                  : "text-zinc-500 shrink-0"
              }
            >
              {result.slotStatuses[i] === "correct" ? "Correct" : "Missed"}
            </span>
          </div>
        ))}
      </div>
      <button
        onClick={onNewQuiz}
        className="w-full rounded-full bg-foreground text-background py-3 font-medium"
      >
        New Quiz
      </button>
    </div>
  );
}
