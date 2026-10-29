"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_THEME_ID, THEME_STORAGE_KEY, THEMES, isThemeId } from "@/lib/theme";

function readInitialTheme(): string {
  if (typeof window === "undefined") return DEFAULT_THEME_ID;
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("theme");
    if (fromUrl && isThemeId(fromUrl)) return fromUrl;

    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored && isThemeId(stored) ? stored : DEFAULT_THEME_ID;
  } catch {
    return DEFAULT_THEME_ID;
  }
}

export default function ThemeSwitcher() {
  // Always starts at the default so the server-rendered markup and the
  // client's first render match exactly (no hydration mismatch) — the real
  // stored/URL theme is applied right after mount, once we're safely
  // client-only. The <html> element's colors are already correct from the
  // very first paint regardless, via the blocking script in layout.tsx.
  const [theme, setTheme] = useState<string>(DEFAULT_THEME_ID);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const actual = readInitialTheme();
      if (actual !== DEFAULT_THEME_ID) setTheme(actual);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectTheme(id: string) {
    setTheme(id);
    setOpen(false);
    setFilter("");
    document.documentElement.setAttribute("data-theme", id);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, id);
    } catch {
      // localStorage may be unavailable (private mode, blocked cookies, etc.)
    }
  }

  function toggleOpen() {
    setOpen((o) => {
      const next = !o;
      if (next) {
        // focus the filter input once it's rendered
        setTimeout(() => filterRef.current?.focus(), 0);
      }
      return next;
    });
  }

  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return THEMES;
    return THEMES.filter((t) => t.label.includes(q) || t.id.includes(q));
  }, [filter]);

  return (
    <div ref={containerRef} className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-56 rounded-md bg-background-alt p-1 shadow-lg">
          <input
            ref={filterRef}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="filter themes…"
            autoComplete="off"
            className="mb-1 w-full rounded-md border border-sub-alt bg-background px-2 py-1 text-sm text-foreground placeholder:text-sub outline-none focus:border-accent"
          />
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-sm text-sub lowercase">no themes match</p>
            ) : (
              filtered.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => selectTheme(t.id)}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm lowercase transition-colors ${
                    t.id === theme ? "text-accent" : "text-sub hover:text-foreground"
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: t.swatch }}
                    aria-hidden
                  />
                  <span className="truncate">{t.label}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={toggleOpen}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-md bg-background-alt px-3 py-1.5 text-sm lowercase text-sub transition-colors hover:text-foreground"
      >
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: current.swatch }} aria-hidden />
        theme: {current.label}
      </button>
    </div>
  );
}
