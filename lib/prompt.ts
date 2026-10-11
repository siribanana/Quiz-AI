export type Difficulty = "easy" | "difficult" | "hardcore";
export type QuizMode = "general" | "naming";

export const DIFFICULTIES: Difficulty[] = ["easy", "difficult", "hardcore"];
export const QUIZ_MODES: QuizMode[] = ["general", "naming"];

export const DEFAULT_QUESTION_COUNT = 10;
export const MIN_QUESTION_COUNT = 3;
export const MAX_QUESTION_COUNT = 20;

const LIST_ADJECTIVES =
  "most|best|worst|longest|shortest|tallest|biggest|smallest|highest|lowest|greatest|largest|oldest|newest|youngest|richest|poorest|fastest|slowest|popular|visited|famous|important|dangerous|deadliest|deepest|wealthiest";

function clampQuestionCount(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_QUESTION_COUNT;
  return Math.min(MAX_QUESTION_COUNT, Math.max(MIN_QUESTION_COUNT, Math.round(n)));
}

/**
 * Looks for an explicit count in the topic text (e.g. "top 5", "7 longest rivers",
 * "ask me 5 questions"). Deliberately narrow — only matches numbers clearly tied to
 * a list/question count, so it won't misfire on numbers that are just part of a name
 * or date (e.g. "World War 2", "Fallout 4").
 */
export function extractRequestedCount(topic: string): number {
  const questionCountMatch = topic.match(/\b(\d{1,3})\s+questions?\b/i);
  if (questionCountMatch) return clampQuestionCount(parseInt(questionCountMatch[1], 10));

  const topMatch = topic.match(/\btop[\s-]*(\d{1,3})\b/i);
  if (topMatch) return clampQuestionCount(parseInt(topMatch[1], 10));

  const listAdjectiveMatch = topic.match(new RegExp(`\\b(\\d{1,3})\\s+(${LIST_ADJECTIVES})\\b`, "i"));
  if (listAdjectiveMatch) return clampQuestionCount(parseInt(listAdjectiveMatch[1], 10));

  return DEFAULT_QUESTION_COUNT;
}

function buildBaseSystemPrompt(count: number): string {
  return `You are a quiz-question generator. Given a topic, research it using the web_search tool and produce content for a ${count}-question fill-in-the-blank quiz.

Rules:
- Produce exactly ${count} questions.
- Each question must have a single short, unambiguous correct answer (a word, name, number, or short phrase) — not multiple choice.
- Phrase each "prompt" as a direct question or a fill-in-the-blank statement whose answer is the thing being tested (e.g. "Which tower in Paris was completed in 1889?" or "The tallest mountain in the world is ___.").
- Use the web_search tool to verify facts, especially anything that could be outdated, ranked, or disputed (e.g. visitor counts, current title-holders, recent events). Prefer well-established, widely agreed-upon facts when a ranking might be volatile.
- For each question, provide "answer" (the canonical correct answer, properly capitalized) and "acceptableAnswers": 4-8 alternate phrasings a user might reasonably type (synonyms, alternate names/spellings, with/without a qualifying word). Do not bother enumerating casing or punctuation variants — only substantive alternative wordings.
- Never reveal an answer inside another question's "prompt".
- Respond with only the structured JSON output — no extra commentary.`;
}

const DIFFICULTY_GUIDANCE: Record<Difficulty, string> = {
  easy:
    "Difficulty: EASY. Focus only on the most well-known, widely recognized facts about the topic — the kind of thing a casual, non-expert would already know or could easily guess. Avoid exact statistics, dates, or niche details. Favor the single most famous fact(s) about the topic over secondary details.",
  difficult:
    "Difficulty: DIFFICULT. Require real familiarity with the topic — precise figures, dates, rankings, or secondary facts that go beyond what a casual observer would know, but that are still well-documented and findable via web search. Avoid questions that are so obscure they'd require specialist expertise.",
  hardcore:
    "Difficulty: HARDCORE. Go after obscure, highly specific, or little-known facts — exact statistics, minor details, deep-cut trivia that only true enthusiasts or experts would know. Deliberately avoid the most commonly known facts about the topic. Every question should feel genuinely hard, even for someone fairly knowledgeable about the topic.",
};

function buildModeGuidance(mode: QuizMode, count: number): string {
  if (mode === "general") {
    return "Quiz type: GENERAL. Ask a well-rounded mix of questions about the topic — facts, dates, people, places, causes, effects, numbers, etc. Do not simply ask the user to name items in a list.";
  }

  return `Quiz type: NAMING / RANKING. The topic describes a ranked or listed set of items (e.g. "top ${count} mountains by height", "the ${count} most visited attractions in the world"). Each of the ${count} questions must ask the user to name ONE specific item from that list, identified by its rank or position (e.g. "Ranked #1 by height — name it." or "The 7th most visited attraction in the world is ___."). The "answer" for every question must be just the name of that item (e.g. the mountain name, the attraction name) — never a date, statistic, or other fact about it. Cover ranks 1 through ${count} of the real list (researched via web search), without repeating the same item twice. IMPORTANT: return the "questions" array ordered by rank ascending — index 0 must be rank #1 (the top of the list), index 1 must be rank #2, and so on through index ${count - 1} as rank #${count}. The client displays each question strictly by its array position as "#1", "#2", etc., without reading rank out of the prompt text, so the array order must exactly match the real ranking.`;
}

export function buildSystemPrompt(difficulty: Difficulty, mode: QuizMode, count: number): string {
  const base = buildBaseSystemPrompt(count);
  if (mode === "naming") {
    return `${base}\n\n${buildModeGuidance(mode, count)}`;
  }
  return `${base}\n\n${DIFFICULTY_GUIDANCE[difficulty]}\n\n${buildModeGuidance(mode, count)}`;
}

export function buildUserPrompt(topic: string, count: number): string {
  return `Generate a ${count}-question fill-in-the-blank quiz about: ${topic}`;
}

export function isDifficulty(value: unknown): value is Difficulty {
  return typeof value === "string" && DIFFICULTIES.includes(value as Difficulty);
}

export function isQuizMode(value: unknown): value is QuizMode {
  return typeof value === "string" && QUIZ_MODES.includes(value as QuizMode);
}
