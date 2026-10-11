import { useEffect, useRef, useState } from "react";

export type FinishReason = "allCorrect" | "timeUp" | "gaveUp";
export type SlotStatus = "unanswered" | "correct" | "revealed";

export interface FinishResult {
  score: number;
  total: number;
  timeRemainingSeconds: number;
  reason: FinishReason;
  slotStatuses: SlotStatus[];
}

interface UseQuizClockArgs {
  timeLimitSeconds: number;
  allCorrect: boolean;
  onFinish: (reason: FinishReason, remainingSeconds: number) => void;
}

export function useQuizClock({ timeLimitSeconds, allCorrect, onFinish }: UseQuizClockArgs) {
  const [remainingSeconds, setRemainingSeconds] = useState(timeLimitSeconds);
  const finishedRef = useRef(false);

  function finish(reason: FinishReason) {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish(reason, remainingSeconds);
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
    if (finishedRef.current) return;
    if (allCorrect) {
      const t = setTimeout(() => finish("allCorrect"), 0);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCorrect]);

  function giveUp() {
    if (finishedRef.current) return;
    const confirmed = window.confirm(
      "Give up? You'll jump straight to the results with remaining answers revealed."
    );
    if (confirmed) finish("gaveUp");
  }

  return { remainingSeconds, giveUp };
}
