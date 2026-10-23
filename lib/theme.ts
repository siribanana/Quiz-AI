export interface ThemeOption {
  id: string;
  label: string;
  swatch: string;
}

// Keep in sync with the inline bootstrap script in app/layout.tsx, which
// can't import this constant since it must run before any JS module loads.
export const THEME_STORAGE_KEY = "quizai-theme";

export const DEFAULT_THEME_ID = "serika-dark";

export const THEMES: ThemeOption[] = [
  { id: "serika-dark", label: "serika dark", swatch: "#e2b714" },
  { id: "hammerhead", label: "hammerhead", swatch: "#4fcdb9" },
];

export function isThemeId(value: string): boolean {
  return THEMES.some((t) => t.id === value);
}
