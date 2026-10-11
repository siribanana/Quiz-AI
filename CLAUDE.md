# Quiz AI

## Overview
A consumer web app: the user types any topic prompt (e.g. "the 10 most visited attractions in the world"), and the app researches it live via an AI web search tool and generates a 10-question fill-in-the-blank quiz — even for topics with no pre-made quiz anywhere. The user then plays the quiz against a timer, typing free-text answers into 10 blank slots. Each slot is checked instantly with lenient matching (case/punctuation/article-insensitive, minor-typo-tolerant). No accounts, no saved history, no sharing — each quiz is generated and played once per browser session.

## Tech Stack
- Next.js 16 (App Router, TypeScript), Tailwind CSS v4
- `@anthropic-ai/sdk`, model `claude-opus-4-8`, with the `web_search_20260209` server tool and `output_config.format` (JSON schema) for structured quiz output
- No database, no auth — quiz state lives entirely in React component state for the session

## Project Structure
```
app/
├── layout.tsx, globals.css, page.tsx   (renders <QuizApp />)
└── api/generate-quiz/route.ts          (only place ANTHROPIC_API_KEY is read)
components/
├── QuizApp.tsx       ("use client", owns state machine: idle→generating→ready→playing→finished)
├── TopicForm.tsx      (topic input + time-limit selector)
├── QuizBoard.tsx       (timer + 10 QuestionSlot grid + live score; owns per-slot state)
├── QuestionSlot.tsx    (single slot: prompt, input, correct/retry/revealed states)
├── Timer.tsx            (mm:ss countdown display)
└── ResultsSummary.tsx   (score, time used, per-question review, "New Quiz")
lib/
├── anthropic.ts      (server-only Anthropic client singleton)
├── quizSchema.ts      (Quiz/QuizQuestion types + JSON schema + shape validator)
├── prompt.ts           (system/user prompt builders)
└── answerMatching.ts    (normalize(), levenshtein(), checkAnswer() — pure, no deps)
```

## Commands
- `npm run dev` — start the dev server (http://localhost:3000)
- `npm run build` — production build
- `npm run lint` — ESLint

## Setup
Requires `ANTHROPIC_API_KEY` in `.env.local` (see `.env.example`) — get one from the Anthropic Console. This is a separate credential from Claude Code's own login.

## Notes
- The API key is only ever read server-side in `app/api/generate-quiz/route.ts`; the browser only ever calls that route, never `api.anthropic.com` directly.
- `output_config.format` guarantees valid JSON shape but not array length, so the route still validates for exactly 10 questions (truncating extras, retrying once if short) before returning.
- Answer matching intentionally has no NLP dependency — see `lib/answerMatching.ts` for the normalization + length-scaled Levenshtein approach.
