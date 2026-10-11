import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import { getAnthropicClient } from "@/lib/anthropic";
import {
  buildSystemPrompt,
  buildUserPrompt,
  isDifficulty,
  isQuizMode,
  type Difficulty,
  type QuizMode,
} from "@/lib/prompt";
import { QUIZ_JSON_SCHEMA, isValidQuizShape, type Quiz } from "@/lib/quizSchema";

export const maxDuration = 60;

const MODEL = "claude-opus-4-8";
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
  mode: QuizMode
) {
  const client = getAnthropicClient();
  return client.messages.stream({
    model: MODEL,
    max_tokens: maxTokens,
    system: buildSystemPrompt(difficulty, mode),
    messages,
    tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 15 }],
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
  mode: QuizMode
): Promise<Anthropic.Message> {
  let message = await callModel(messages, maxTokens, difficulty, mode);
  let resumes = 0;

  while (message.stop_reason === "pause_turn" && resumes < MAX_RESUME_ATTEMPTS) {
    messages = [...messages, { role: "assistant", content: message.content }];
    message = await callModel(messages, maxTokens, difficulty, mode);
    resumes++;
  }

  return message;
}

async function generateQuiz(topic: string, difficulty: Difficulty, mode: QuizMode): Promise<Quiz> {
  const messages: MessageParam[] = [{ role: "user", content: buildUserPrompt(topic) }];
  let maxTokens = 8000;

  let message = await resolveFinalMessage(messages, maxTokens, difficulty, mode);

  if (message.stop_reason === "refusal") {
    const err = new Error("refusal");
    err.name = "QuizRefusalError";
    throw err;
  }

  if (message.stop_reason === "max_tokens") {
    maxTokens = 16000;
    message = await resolveFinalMessage(messages, maxTokens, difficulty, mode);
  }

  const text = finalTextOf(message);
  const parsed = extractJson(text);

  if (!isValidQuizShape(parsed)) {
    throw new Error("Malformed quiz shape");
  }

  let quiz = parsed;

  if (quiz.questions.length > 10) {
    quiz = { ...quiz, questions: quiz.questions.slice(0, 10) };
  } else if (quiz.questions.length < 10) {
    const retryMessages: MessageParam[] = [
      ...messages,
      { role: "assistant", content: message.content },
      {
        role: "user",
        content: `You returned only ${quiz.questions.length} questions. Please return exactly 10 questions.`,
      },
    ];
    const retryMessage = await resolveFinalMessage(retryMessages, maxTokens, difficulty, mode);
    const retryParsed = extractJson(finalTextOf(retryMessage));
    if (isValidQuizShape(retryParsed) && retryParsed.questions.length >= 10) {
      quiz = { ...retryParsed, questions: retryParsed.questions.slice(0, 10) };
    } else {
      throw new Error("Could not obtain 10 questions after retry");
    }
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

  try {
    const quiz = await generateQuiz(topic, difficulty, mode);
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
