export interface QuizQuestion {
  id: number;
  prompt: string;
  answer: string;
  acceptableAnswers: string[];
}

export interface Quiz {
  topic: string;
  questions: QuizQuestion[];
}

export const QUIZ_JSON_SCHEMA = {
  type: "object",
  properties: {
    topic: { type: "string" },
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "integer" },
          prompt: { type: "string" },
          answer: { type: "string" },
          acceptableAnswers: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["id", "prompt", "answer", "acceptableAnswers"],
        additionalProperties: false,
      },
    },
  },
  required: ["topic", "questions"],
  additionalProperties: false,
} as const;

export function isValidQuizShape(value: unknown): value is Quiz {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.topic !== "string") return false;
  if (!Array.isArray(v.questions)) return false;
  return v.questions.every((q): q is QuizQuestion => {
    if (typeof q !== "object" || q === null) return false;
    const question = q as Record<string, unknown>;
    return (
      typeof question.id === "number" &&
      typeof question.prompt === "string" &&
      question.prompt.trim().length > 0 &&
      typeof question.answer === "string" &&
      question.answer.trim().length > 0 &&
      Array.isArray(question.acceptableAnswers) &&
      question.acceptableAnswers.every((a) => typeof a === "string")
    );
  });
}
