"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  // On mount: read saved preference, then apply
  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    const initial = saved ?? (
      window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"
    );
    applyTheme(initial);
    setTheme(initial);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      applyTheme(next);
      localStorage.setItem("theme", next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

function applyTheme(theme: Theme) {
  if (theme === "light") {
    document.documentElement.classList.add("light-theme");
  } else {
    document.documentElement.classList.remove("light-theme");
  }
  document.documentElement.style.colorScheme = theme;
}

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
