"use client";

import { useEffect, useRef, useState } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);

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
    document.documentElement.setAttribute("data-theme", id);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, id);
    } catch {
      // localStorage may be unavailable (private mode, blocked cookies, etc.)
    }
  }

  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <div ref={containerRef} className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="absolute bottom-full right-0 mb-2 min-w-[150px] rounded-md bg-background-alt p-1 shadow-lg">
          {THEMES.map((t) => (
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
              {t.label}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-md bg-background-alt px-3 py-1.5 text-sm lowercase text-sub transition-colors hover:text-foreground"
      >
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: current.swatch }} aria-hidden />
        theme: {current.label}
      </button>
    </div>
  );
}
