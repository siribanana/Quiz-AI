export type Difficulty = "easy" | "difficult" | "hardcore";
export type QuizMode = "general" | "naming";

export const DIFFICULTIES: Difficulty[] = ["easy", "difficult", "hardcore"];
export const QUIZ_MODES: QuizMode[] = ["general", "naming"];

const BASE_SYSTEM_PROMPT = `You are a quiz-question generator. Given a topic, research it using the web_search tool and produce content for a 10-question fill-in-the-blank quiz.

Rules:
- Produce exactly 10 questions.
- Each question must have a single short, unambiguous correct answer (a word, name, number, or short phrase) — not multiple choice.
- Phrase each "prompt" as a direct question or a fill-in-the-blank statement whose answer is the thing being tested (e.g. "Which tower in Paris was completed in 1889?" or "The tallest mountain in the world is ___.").
- Use the web_search tool to verify facts, especially anything that could be outdated, ranked, or disputed (e.g. visitor counts, current title-holders, recent events). Prefer well-established, widely agreed-upon facts when a ranking might be volatile.
- For each question, provide "answer" (the canonical correct answer, properly capitalized) and "acceptableAnswers": 4-8 alternate phrasings a user might reasonably type (synonyms, alternate names/spellings, with/without a qualifying word). Do not bother enumerating casing or punctuation variants — only substantive alternative wordings.
- Never reveal an answer inside another question's "prompt".
- Respond with only the structured JSON output — no extra commentary.`;

const DIFFICULTY_GUIDANCE: Record<Difficulty, string> = {
  easy:
    "Difficulty: EASY. Focus only on the most well-known, widely recognized facts about the topic — the kind of thing a casual, non-expert would already know or could easily guess. Avoid exact statistics, dates, or niche details. Favor the single most famous fact(s) about the topic over secondary details.",
  difficult:
    "Difficulty: DIFFICULT. Require real familiarity with the topic — precise figures, dates, rankings, or secondary facts that go beyond what a casual observer would know, but that are still well-documented and findable via web search. Avoid questions that are so obscure they'd require specialist expertise.",
  hardcore:
    "Difficulty: HARDCORE. Go after obscure, highly specific, or little-known facts — exact statistics, minor details, deep-cut trivia that only true enthusiasts or experts would know. Deliberately avoid the most commonly known facts about the topic. Every question should feel genuinely hard, even for someone fairly knowledgeable about the topic.",
};

const MODE_GUIDANCE: Record<QuizMode, string> = {
  general:
    "Quiz type: GENERAL. Ask a well-rounded mix of questions about the topic — facts, dates, people, places, causes, effects, numbers, etc. Do not simply ask the user to name items in a list.",
  naming:
    'Quiz type: NAMING / RANKING. The topic describes a ranked or listed set of items (e.g. "top 10 mountains by height", "the 10 most visited attractions in the world"). Each of the 10 questions must ask the user to name ONE specific item from that list, identified by its rank or position (e.g. "Ranked #1 by height — name it." or "The 7th most visited attraction in the world is ___."). The "answer" for every question must be just the name of that item (e.g. the mountain name, the attraction name) — never a date, statistic, or other fact about it. Cover ranks 1 through 10 of the real list (researched via web search), without repeating the same item twice. If the topic as given doesn\'t naturally have 10 distinct ranked items, extend the list sensibly (e.g. widen "top 5" to the top 10) while staying faithful to real rankings.',
};

export function buildSystemPrompt(difficulty: Difficulty, mode: QuizMode): string {
  return `${BASE_SYSTEM_PROMPT}\n\n${DIFFICULTY_GUIDANCE[difficulty]}\n\n${MODE_GUIDANCE[mode]}`;
}

export function buildUserPrompt(topic: string): string {
  return `Generate a 10-question fill-in-the-blank quiz about: ${topic}`;
}

export function isDifficulty(value: unknown): value is Difficulty {
  return typeof value === "string" && DIFFICULTIES.includes(value as Difficulty);
}

export function isQuizMode(value: unknown): value is QuizMode {
  return typeof value === "string" && QUIZ_MODES.includes(value as QuizMode);
}
