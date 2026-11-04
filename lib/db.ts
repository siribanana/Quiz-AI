import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

export interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  is_paid: number;
  created_at: string;
}

export interface SessionRow {
  token: string;
  user_id: number;
  expires_at: string;
}

export interface QuizResultRow {
  id: number;
  user_id: number;
  topic: string;
  mode: string;
  difficulty: string | null;
  question_count: number;
  score: number;
  total: number;
  reason: string;
  time_limit_seconds: number;
  time_remaining_seconds: number;
  created_at: string;
}

// Vercel's serverless functions have a read-only filesystem outside /tmp, so
// the project-folder "data/" path only works for local dev / a persistent
// host. On Vercel, fall back to /tmp so requests don't hard-crash — note
// this means data there doesn't survive cold starts or redeploys (see the
// "known limitation" note in CLAUDE.md).
const dataDir = process.env.VERCEL ? "/tmp/quizai-data" : path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (db) return db;

  db = new Database(path.join(dataDir, "quizai.db"));
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      is_paid INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quiz_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      topic TEXT NOT NULL,
      mode TEXT NOT NULL,
      difficulty TEXT,
      question_count INTEGER NOT NULL,
      score INTEGER NOT NULL,
      total INTEGER NOT NULL,
      reason TEXT NOT NULL,
      time_limit_seconds INTEGER NOT NULL,
      time_remaining_seconds INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON quiz_results(user_id);
  `);

  return db;
}

export function createUser(username: string, passwordHash: string): UserRow {
  const result = getDb()
    .prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)")
    .run(username, passwordHash);
  return findUserById(Number(result.lastInsertRowid))!;
}

export function findUserByUsername(username: string): UserRow | undefined {
  return getDb().prepare("SELECT * FROM users WHERE username = ?").get(username) as UserRow | undefined;
}

export function findUserById(id: number): UserRow | undefined {
  return getDb().prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
}

export function setUserPaid(userId: number, isPaid: boolean): void {
  getDb().prepare("UPDATE users SET is_paid = ? WHERE id = ?").run(isPaid ? 1 : 0, userId);
}

export function createSession(token: string, userId: number, expiresAt: string): void {
  getDb().prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)").run(token, userId, expiresAt);
}

export function findSession(token: string): SessionRow | undefined {
  return getDb().prepare("SELECT * FROM sessions WHERE token = ?").get(token) as SessionRow | undefined;
}

export function deleteSession(token: string): void {
  getDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

export function saveQuizResult(result: Omit<QuizResultRow, "id" | "created_at">): void {
  getDb()
    .prepare(
      `INSERT INTO quiz_results
        (user_id, topic, mode, difficulty, question_count, score, total, reason, time_limit_seconds, time_remaining_seconds)
       VALUES (@user_id, @topic, @mode, @difficulty, @question_count, @score, @total, @reason, @time_limit_seconds, @time_remaining_seconds)`
    )
    .run(result);
}

export function getResultsForUser(userId: number, limit = 50): QuizResultRow[] {
  return getDb()
    .prepare("SELECT * FROM quiz_results WHERE user_id = ? ORDER BY created_at DESC LIMIT ?")
    .all(userId, limit) as QuizResultRow[];
}
