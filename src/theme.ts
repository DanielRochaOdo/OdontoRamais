const THEME_KEY = "odonto-theme";

export type ThemeMode = "light" | "dark";

export function getStoredTheme(): ThemeMode {
  const stored = window.localStorage.getItem(THEME_KEY);
  return stored === "dark" ? "dark" : "light";
}

export function applyTheme(theme: ThemeMode) {
  document.documentElement.setAttribute("data-theme", theme);
  window.localStorage.setItem(THEME_KEY, theme);
}

export function toggleTheme(): ThemeMode {
  const nextTheme: ThemeMode = getStoredTheme() === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
  return nextTheme;
}
