"use client";

import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Quiz } from "@/lib/quizSchema";
import { useQuizClock, type FinishResult, type SlotStatus } from "@/lib/useQuizClock";
import Timer from "./Timer";
import ConfirmDialog from "./ConfirmDialog";

interface Props {
  quiz: Quiz;
  timeLimitSeconds: number;
  onFinish: (result: FinishResult) => void;
}

type PositionFeedback = "correct" | "incorrect" | null;

function shuffleOnce(length: number): number[] {
  const indices = Array.from({ length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices;
}

// Shuffles, and explicitly re-rolls if it happens to land back on rank order
// (identity permutation) — the whole point is that the list must never be
// presented already in rank order, so chance alone isn't good enough here.
function shuffledIndices(length: number): number[] {
  if (length <= 1) return Array.from({ length }, (_, i) => i);
  let indices = shuffleOnce(length);
  while (indices.every((v, i) => v === i)) {
    indices = shuffleOnce(length);
  }
  return indices;
}

export default function RankingBoard({ quiz, timeLimitSeconds, onFinish }: Props) {
  const total = quiz.questions.length;
  const [order, setOrder] = useState<number[]>(() => shuffledIndices(total));
  const [feedback, setFeedback] = useState<PositionFeedback[]>(() => Array(total).fill(null));
  const [lastCheckedScore, setLastCheckedScore] = useState<number | null>(null);
  const [flashToken, setFlashToken] = useState(0);

  const allCorrect = lastCheckedScore === total;

  const { remainingSeconds, confirmingGiveUp, requestGiveUp, confirmGiveUp, cancelGiveUp } = useQuizClock({
    timeLimitSeconds,
    allCorrect,
    onFinish: (reason, timeRemainingSeconds) => {
      const slotStatuses: SlotStatus[] = Array(total).fill("revealed");
      order.forEach((originalIndex, position) => {
        if (position === originalIndex) slotStatuses[originalIndex] = "correct";
      });
      const finalScore = slotStatuses.filter((s) => s === "correct").length;
      onFinish({
        score: finalScore,
        total,
        timeRemainingSeconds,
        reason,
        slotStatuses,
      });
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeIndex = order.findIndex((originalIndex) => quiz.questions[originalIndex].id === active.id);
    const overIndex = order.findIndex((originalIndex) => quiz.questions[originalIndex].id === over.id);
    if (activeIndex === -1 || overIndex === -1) return;
    setOrder((prev) => arrayMove(prev, activeIndex, overIndex));
    setFeedback(Array(total).fill(null));
  }

  function handleCheck() {
    const result = order.map<PositionFeedback>((originalIndex, position) =>
      position === originalIndex ? "correct" : "incorrect"
    );
    setFeedback(result);
    setLastCheckedScore(result.filter((f) => f === "correct").length);
    setFlashToken((t) => t + 1);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm">
          <span className="text-sub lowercase">score </span>
          <span className="font-mono text-xl text-foreground">
            {lastCheckedScore === null ? "–" : lastCheckedScore}/{total}
          </span>
        </p>
        <Timer remainingSeconds={remainingSeconds} />
      </div>

      <h2 className="text-center font-semibold mb-1 text-foreground">{quiz.topic}</h2>
      <p className="text-center text-sm text-sub mb-4 lowercase">
        drag into order — #1 at the top, #{total} at the bottom — then check
      </p>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={order.map((originalIndex) => quiz.questions[originalIndex].id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {order.map((originalIndex, position) => (
              <RankingRow
                key={quiz.questions[originalIndex].id}
                id={quiz.questions[originalIndex].id}
                label={quiz.questions[originalIndex].answer}
                position={position}
                feedback={feedback[position]}
                flashToken={flashToken}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="mt-6 flex items-center justify-center gap-4">
        <button
          onClick={handleCheck}
          className="rounded-md bg-accent text-accent-ink px-6 py-2 font-semibold lowercase transition-[filter] hover:brightness-110"
        >
          check order
        </button>
        <button
          onClick={requestGiveUp}
          className="text-sm lowercase text-sub hover:text-error underline-offset-2 hover:underline transition-colors"
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

interface RankingRowProps {
  id: number;
  label: string;
  position: number;
  feedback: PositionFeedback;
  flashToken: number;
}

function RankingRow({ id, label, position, feedback, flashToken }: RankingRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const bgClass = feedback === "correct" ? "bg-correct/10" : "bg-background-alt";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative flex items-center gap-3 rounded-md p-3 transition-colors ${bgClass} ${
        isDragging ? "z-10 opacity-60" : ""
      }`}
    >
      {feedback === "incorrect" && (
        <span
          key={flashToken}
          aria-hidden
          className="shake-flash pointer-events-none absolute inset-0 rounded-md"
        />
      )}
      {feedback === "correct" && (
        <span
          key={flashToken}
          aria-hidden
          className="flash-correct pointer-events-none absolute inset-0 rounded-md"
        />
      )}
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="drag to reorder"
        className="shrink-0 touch-none text-sub transition-colors hover:text-foreground active:cursor-grabbing cursor-grab"
      >
        <GripIcon />
      </button>
      <span className="w-6 shrink-0 text-right font-mono text-sm text-sub">{position + 1}.</span>
      <span className="flex-1 font-medium text-foreground">{label}</span>
      {feedback === "correct" && <span className="shrink-0 text-sm font-semibold text-correct">✓</span>}
    </div>
  );
}

function GripIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <circle cx="5" cy="3" r="1.3" />
      <circle cx="11" cy="3" r="1.3" />
      <circle cx="5" cy="8" r="1.3" />
      <circle cx="11" cy="8" r="1.3" />
      <circle cx="5" cy="13" r="1.3" />
      <circle cx="11" cy="13" r="1.3" />
    </svg>
  );
}
