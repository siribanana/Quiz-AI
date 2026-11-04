# Quiz AI

## Overview
A consumer web app: the user types any topic (e.g. "top 10 mountains by height"), and the app researches it live via an AI web search tool and generates a fill-in-the-blank quiz — even for topics with no pre-made quiz anywhere. Three quiz types: General (open trivia), Naming (type the item at each rank), Ranking (drag items into rank order). Question count adapts to the topic ("top 5 ..." → 5 questions; no explicit count → defaults to 10, clamped 3–20). Optional accounts let a user save their play history; signed-in paid accounts unlock the Hardcore difficulty, which uses a stronger model.

## Tech Stack
- Next.js 16 (App Router, TypeScript), Tailwind CSS v4
- `@anthropic-ai/sdk` — `claude-haiku-5-5` for Easy/Difficult and all Naming/Ranking generation, `claude-sonnet-5-5` for the paid-only Hardcore difficulty — with the `web_search_20260209` server tool and `output_config.format` (JSON schema) for structured quiz output
- `better-sqlite3` — local file DB at `data/quizai.db` (gitignored; **does not persist reliably on Vercel's serverless filesystem** — accounts/history only work reliably in local dev or a long-running Node host, not the current Vercel deployment)
- Auth: self-contained username/password, Node's built-in `crypto.scrypt` for hashing, server-side sessions via an httpOnly cookie — no third-party auth library
- No real billing — "paid" is a manually-toggleable flag (`/api/account/upgrade`), not Stripe

## Project Structure
```
app/
├── layout.tsx            (renders <AuthWidget/>, <ThemeSwitcher/>, github link — global, every page)
├── page.tsx              (renders <QuizApp />)
├── history/page.tsx       (server component; per-user play history, needs login)
└── api/
    ├── generate-quiz/route.ts      (only place ANTHROPIC_API_KEY is read; enforces the Hardcore paid gate)
    ├── quiz-results/route.ts        (saves a finished quiz's result for the signed-in user)
    └── auth/{signup,login,logout,me}/route.ts, account/upgrade/route.ts
components/
├── QuizApp.tsx            (state machine: idle→generating→ready→playing→finished; saves results on finish)
├── TopicForm.tsx           (topic input, random-topic button, time/difficulty/mode controls; locks Hardcore when not eligible)
├── QuizBoard.tsx / NamingBoard.tsx / RankingBoard.tsx   (one per quiz type)
├── ConfirmDialog.tsx        (themed in-app confirm, used by "give up")
├── AuthWidget.tsx            (login/signup popover, or account info + upgrade/history/logout)
├── ThemeSwitcher.tsx          (187 Monkeytype themes, filterable, multi-color swatch)
└── ResultsSummary.tsx          (score, time used, per-question review, "New Quiz")
lib/
├── anthropic.ts, prompt.ts, quizSchema.ts, answerMatching.ts   (generation + matching, as before)
├── db.ts            (better-sqlite3 connection + schema + query helpers)
├── auth.ts           (password hashing, session create/verify, cookie handling)
├── useAuth.ts          (client hook: fetches /api/auth/me)
├── theme.ts             (generated — see scripts/generate-theme-options.mjs)
└── exampleTopics.ts       (curated list for the random-topic button)
scripts/
└── generate-theme-options.mjs   (regenerates lib/theme.ts from app/themes.css — npm run generate:themes)
```

## Commands
- `npm run dev` — start the dev server (http://localhost:3000)
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run generate:themes` — regenerate `lib/theme.ts` after editing `app/themes.css`

## Setup
Requires `ANTHROPIC_API_KEY` in `.env.local` (see `.env.example`) — get one from the Anthropic Console. This is a separate credential from Claude Code's own login. The SQLite file is created automatically under `data/` on first run.

## Notes
- The API key is only ever read server-side in `app/api/generate-quiz/route.ts`; the browser only ever calls that route, never `api.anthropic.com` directly.
- `output_config.format` guarantees valid JSON shape but not array length, so the route still validates the exact requested question count (truncating extras, retrying once if short) before returning.
- `lib/quizSchema.ts`'s `findAnswerLeaks` catches questions that accidentally reveal another question's answer (e.g. describing item #4 via item #1's name) and triggers one corrective retry.
- Answer matching intentionally has no NLP dependency — see `lib/answerMatching.ts` for the normalization + length-scaled Levenshtein approach.
- The Hardcore gate is enforced server-side in `app/api/generate-quiz/route.ts` (403 if not signed in + paid) — the client-side lock in `TopicForm.tsx` is just UX, not the real security boundary.
- **Known limitation:** SQLite-on-Vercel is not a durable setup — fine for local dev, but accounts/history created on the live Vercel deployment can be lost across deployments/cold starts. Migrating to a hosted DB (Vercel Postgres, Turso, etc.) is the fix if this needs to work reliably in production.
