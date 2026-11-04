"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/useAuth";

type Mode = "login" | "signup";

export default function AuthWidget() {
  const { user, loading, refetch } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/auth/${mode === "login" ? "login" : "signup"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setUsername("");
      setPassword("");
      setOpen(false);
      await refetch();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    await refetch();
  }

  async function handleUpgrade() {
    setUpgrading(true);
    try {
      await fetch("/api/account/upgrade", { method: "POST" });
      await refetch();
    } finally {
      setUpgrading(false);
    }
  }

  if (loading) return null;

  if (user) {
    return (
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-3 rounded-md bg-background-alt px-3 py-1.5 text-sm lowercase">
        <span className="text-foreground">{user.username}</span>
        <span className={user.isPaid ? "text-accent" : "text-sub"}>{user.isPaid ? "paid" : "free"}</span>
        {!user.isPaid && (
          <button
            type="button"
            onClick={handleUpgrade}
            disabled={upgrading}
            className="text-sub transition-colors hover:text-accent disabled:opacity-50"
          >
            upgrade
          </button>
        )}
        <a href="/history" className="text-sub transition-colors hover:text-foreground">
          history
        </a>
        <button
          type="button"
          onClick={handleLogout}
          className="text-sub transition-colors hover:text-foreground"
        >
          log out
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="fixed bottom-4 left-4 z-50">
      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-64 rounded-md bg-background-alt p-4 shadow-lg">
          <div className="mb-3 flex gap-4 text-sm lowercase">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={mode === "login" ? "text-accent" : "text-sub hover:text-foreground"}
            >
              log in
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={mode === "signup" ? "text-accent" : "text-sub hover:text-foreground"}
            >
              sign up
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-2">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              autoComplete="username"
              className="w-full rounded-md border border-sub-alt bg-background px-2 py-1.5 text-sm text-foreground placeholder:text-sub outline-none focus:border-accent"
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="w-full rounded-md border border-sub-alt bg-background px-2 py-1.5 text-sm text-foreground placeholder:text-sub outline-none focus:border-accent"
            />
            {error && <p className="text-xs text-error">{error}</p>}
            <button
              type="submit"
              disabled={submitting || !username || !password}
              className="w-full rounded-md bg-accent px-3 py-1.5 text-sm font-semibold lowercase text-accent-ink transition-[filter] hover:brightness-110 disabled:opacity-50"
            >
              {mode === "login" ? "log in" : "sign up"}
            </button>
          </form>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-md bg-background-alt px-3 py-1.5 text-sm lowercase text-sub transition-colors hover:text-foreground"
      >
        log in / sign up
      </button>
    </div>
  );
}
