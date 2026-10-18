import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import { getAnthropicClient } from "@/lib/anthropic";
import {
  buildSystemPrompt,
  buildUserPrompt,
  extractRequestedCount,
  isDifficulty,
  isQuizMode,
  type Difficulty,
  type QuizMode,
} from "@/lib/prompt";
import { QUIZ_JSON_SCHEMA, findAnswerLeaks, isValidQuizShape, type Quiz } from "@/lib/quizSchema";

export const maxDuration = 60;

const MODEL = "claude-haiku-5-5";
const MAX_RESUME_ATTEMPTS = 3;

function extractJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenced) {
      return JSON.parse(fenced[1]);
    }
    throw new Error("Model output was not valid JSON");
  }
}

async function callModel(
  messages: MessageParam[],
  maxTokens: number,
  difficulty: Difficulty,
  mode: QuizMode,
  count: number
) {
  const client = getAnthropicClient();
  return client.messages.stream({
    model: MODEL,
    max_tokens: maxTokens,
    system: buildSystemPrompt(difficulty, mode, count),
    messages,
    tools: [{ type: "web_search_20260209", name: "web_search", max_uses: Math.max(15, count + 5) }],
    output_config: { format: { type: "json_schema", schema: QUIZ_JSON_SCHEMA } },
  }).finalMessage();
}

function finalTextOf(message: Anthropic.Message): string {
  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text block in model response");
  }
  return textBlock.text;
}

async function resolveFinalMessage(
  messages: MessageParam[],
  maxTokens: number,
  difficulty: Difficulty,
  mode: QuizMode,
  count: number
): Promise<Anthropic.Message> {
  let message = await callModel(messages, maxTokens, difficulty, mode, count);
  let resumes = 0;

  while (message.stop_reason === "pause_turn" && resumes < MAX_RESUME_ATTEMPTS) {
    messages = [...messages, { role: "assistant", content: message.content }];
    message = await callModel(messages, maxTokens, difficulty, mode, count);
    resumes++;
  }

  return message;
}

async function generateQuiz(
  topic: string,
  difficulty: Difficulty,
  mode: QuizMode,
  count: number
): Promise<Quiz> {
  let messages: MessageParam[] = [{ role: "user", content: buildUserPrompt(topic, count) }];
  let maxTokens = Math.max(8000, count * 900);

  let message = await resolveFinalMessage(messages, maxTokens, difficulty, mode, count);

  if (message.stop_reason === "refusal") {
    const err = new Error("refusal");
    err.name = "QuizRefusalError";
    throw err;
  }

  if (message.stop_reason === "max_tokens") {
    maxTokens *= 2;
    message = await resolveFinalMessage(messages, maxTokens, difficulty, mode, count);
  }

  const text = finalTextOf(message);
  const parsed = extractJson(text);

  if (!isValidQuizShape(parsed)) {
    throw new Error("Malformed quiz shape");
  }

  let quiz = parsed;

  if (quiz.questions.length > count) {
    quiz = { ...quiz, questions: quiz.questions.slice(0, count) };
  } else if (quiz.questions.length < count) {
    messages = [
      ...messages,
      { role: "assistant", content: message.content },
      {
        role: "user",
        content: `You returned only ${quiz.questions.length} questions. Please return exactly ${count} questions.`,
      },
    ];
    message = await resolveFinalMessage(messages, maxTokens, difficulty, mode, count);
    const retryParsed = extractJson(finalTextOf(message));
    if (isValidQuizShape(retryParsed) && retryParsed.questions.length >= count) {
      quiz = { ...retryParsed, questions: retryParsed.questions.slice(0, count) };
    } else {
      throw new Error(`Could not obtain ${count} questions after retry`);
    }
  }

  const leaks = findAnswerLeaks(quiz.questions);
  if (leaks.length > 0) {
    const fixMessages: MessageParam[] = [
      ...messages,
      { role: "assistant", content: message.content },
      {
        role: "user",
        content: `Some questions leak answers to other questions. Fix the following issues by rewriting only the affected prompts — keep every question's id, answer, and acceptableAnswers unchanged, and keep exactly ${count} questions:\n\n${leaks.join("\n")}\n\nReturn the complete corrected quiz.`,
      },
    ];
    const fixMessage = await resolveFinalMessage(fixMessages, maxTokens, difficulty, mode, count);
    const fixParsed = extractJson(finalTextOf(fixMessage));
    if (isValidQuizShape(fixParsed) && fixParsed.questions.length === count) {
      quiz = fixParsed;
    }
    // If the fix attempt failed or came back malformed, fall through with the
    // original quiz rather than failing the whole request over a leak.
  }

  quiz = {
    ...quiz,
    questions: quiz.questions.map((q) => ({
      ...q,
      acceptableAnswers: q.acceptableAnswers.length > 0 ? q.acceptableAnswers : [q.answer],
    })),
  };

  return quiz;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsedBody = body as { topic?: unknown; difficulty?: unknown; mode?: unknown };
  const topic = typeof parsedBody?.topic === "string" ? parsedBody.topic.trim() : "";

  if (!topic || topic.length < 3) {
    return NextResponse.json({ error: "Please enter a topic." }, { status: 400 });
  }
  if (topic.length > 300) {
    return NextResponse.json({ error: "Topic is too long — please shorten it." }, { status: 400 });
  }

  const difficulty: Difficulty = isDifficulty(parsedBody?.difficulty) ? parsedBody.difficulty : "difficult";
  const mode: QuizMode = isQuizMode(parsedBody?.mode) ? parsedBody.mode : "general";
  const count = extractRequestedCount(topic);

  try {
    const quiz = await generateQuiz(topic, difficulty, mode, count);
    return NextResponse.json({ quiz });
  } catch (error) {
    if (error instanceof Error && error.name === "QuizRefusalError") {
      return NextResponse.json(
        { error: "Couldn't generate a quiz for that topic — try a different one." },
        { status: 422 }
      );
    }
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: "The quiz generator is temporarily unavailable. Please try again." },
        { status: 502 }
      );
    }
    console.error("Quiz generation failed:", error);
    return NextResponse.json(
      { error: "Something went wrong generating your quiz. Please try again." },
      { status: 500 }
    );
  }
}
