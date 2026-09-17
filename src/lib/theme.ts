import { useCallback, useEffect, useState } from "react";

/** Preferência de tema da interface. */
export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "haisfaturamento:theme";

const listeners = new Set<(theme: ThemePreference) => void>();
let current: ThemePreference = "system";

function isTheme(value: string | null): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

function prefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Aplica a preferência no elemento raiz do documento. */
function apply(theme: ThemePreference) {
  if (typeof document === "undefined") return;
  const dark = theme === "dark" || (theme === "system" && prefersDark());
  document.documentElement.classList.toggle("dark", dark);
}

/** Lê a preferência salva (executa apenas no cliente). */
function readStored(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isTheme(stored) ? stored : "system";
}

export function setThemePreference(theme: ThemePreference) {
  current = theme;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, theme);
  }
  apply(theme);
  listeners.forEach((listener) => listener(theme));
}

/**
 * Hook compartilhado entre a sidebar e a página Configurações para que a
 * preferência de tema fique sincronizada em toda a aplicação.
 */
export function useTheme() {
  const [theme, setTheme] = useState<ThemePreference>(current);

  useEffect(() => {
    // Hidratação: só depois do mount é seguro ler localStorage/media query.
    const stored = readStored();
    current = stored;
    setTheme(stored);
    apply(stored);

    const listener = (value: ThemePreference) => setTheme(value);
    listeners.add(listener);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      if (current === "system") apply("system");
    };
    media.addEventListener("change", onSystemChange);

    return () => {
      listeners.delete(listener);
      media.removeEventListener("change", onSystemChange);
    };
  }, []);

  const isDark = theme === "dark" || (theme === "system" && prefersDark());

  const setThemeValue = useCallback((value: ThemePreference) => {
    setThemePreference(value);
  }, []);

  return { theme, isDark, setTheme: setThemeValue };
}
