import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import {
  createSession,
  createUser,
  deleteSession,
  findSession,
  findUserById,
  findUserByUsername,
  type UserRow,
} from "./db";

export const SESSION_COOKIE = "quizai_session";
const SESSION_DAYS = 30;

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashBuffer = Buffer.from(hash, "hex");
  const candidate = scryptSync(password, salt, 64);
  return hashBuffer.length === candidate.length && timingSafeEqual(hashBuffer, candidate);
}

export function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_-]{3,20}$/.test(username);
}

export async function signUp(username: string, password: string): Promise<UserRow> {
  const passwordHash = hashPassword(password);
  const user = createUser(username, passwordHash);
  await startSession(user.id);
  return user;
}

export async function logIn(username: string, password: string): Promise<UserRow | null> {
  const user = findUserByUsername(username);
  if (!user || !verifyPassword(password, user.password_hash)) return null;
  await startSession(user.id);
  return user;
}

async function startSession(userId: number): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  createSession(token, userId, expiresAt);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function logOut(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) deleteSession(token);
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<UserRow | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = findSession(token);
  if (!session) return null;
  if (new Date(session.expires_at).getTime() < Date.now()) {
    deleteSession(token);
    return null;
  }

  return findUserById(session.user_id) ?? null;
}
