import type { Quiz } from "@/lib/quizSchema";
import type { FinishResult } from "@/lib/useQuizClock";

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
        <h2 className="font-mono text-3xl font-bold text-foreground">
          {result.score}/{result.total}
        </h2>
        <p className="text-sm text-sub lowercase">
          {result.reason === "allCorrect"
            ? `finished with ${formatDuration(result.timeRemainingSeconds)} to spare!`
            : result.reason === "gaveUp"
              ? `you gave up — used ${formatDuration(timeUsed)}`
              : `time's up — used ${formatDuration(timeUsed)}`}
        </p>
      </div>
      <div className="space-y-2">
        {quiz.questions.map((q, i) => (
          <div
            key={q.id}
            className="flex items-start justify-between gap-4 rounded-md bg-background-alt p-3"
          >
            <div>
              <p className="text-sm text-sub">{q.prompt}</p>
              <p className="font-medium text-foreground">{q.answer}</p>
            </div>
            <span
              className={`shrink-0 text-sm lowercase ${
                result.slotStatuses[i] === "correct" ? "text-correct" : "text-error"
              }`}
            >
              {result.slotStatuses[i] === "correct" ? "correct" : "missed"}
            </span>
          </div>
        ))}
      </div>
      <button
        onClick={onNewQuiz}
        className="w-full rounded-md bg-accent text-accent-ink py-3 font-semibold lowercase transition-[filter] hover:brightness-110"
      >
        new quiz
      </button>
    </div>
  );
}
