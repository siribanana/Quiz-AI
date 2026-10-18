import { normalize, escapeRegExp } from "./answerMatching";

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

/**
 * Finds questions whose "prompt" text contains the answer (or an acceptable
 * variant) to a *different* question — e.g. a question about Lhotse
 * describing it as "connected to Everest by the South Col" when Everest is
 * the answer to another question. Returns a human-readable note per leak,
 * suitable for feeding back to the model in a corrective retry.
 */
export function findAnswerLeaks(questions: QuizQuestion[]): string[] {
  const leaks: string[] = [];
  const normalizedPrompts = questions.map((q) => normalize(q.prompt));

  questions.forEach((question, i) => {
    questions.forEach((other, j) => {
      if (i === j) return;
      const variants = [other.answer, ...other.acceptableAnswers]
        .map(normalize)
        .filter((v) => v.length > 2);

      for (const variant of variants) {
        const re = new RegExp(`\\b${escapeRegExp(variant)}\\b`);
        if (re.test(normalizedPrompts[i])) {
          leaks.push(
            `Question ${i + 1}'s prompt ("${question.prompt}") reveals the answer to question ${j + 1} ("${other.answer}"). Rewrite question ${i + 1}'s prompt so it no longer mentions or implies "${other.answer}", while keeping its own answer ("${question.answer}") unchanged.`
          );
          break;
        }
      }
    });
  });

  return leaks;
}
