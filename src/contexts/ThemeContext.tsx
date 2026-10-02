import { createContext, useContext, useState } from "react"
import type { ReactNode } from "react"
import { flushSync } from "react-dom"

import { useMountEffect } from "@/shared/hooks/useMountEffect"

type Theme = "dark" | "light"

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = "prissma-theme"
const DEFAULT_THEME: Theme = "dark"

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === "light" || stored === "dark") return stored
  return DEFAULT_THEME
}

/** `data-theme` na raiz é de onde todo o CSS lê; o storage lembra a escolha. */
function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme)
  localStorage.setItem(STORAGE_KEY, theme)
}

function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
}

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useMountEffect(() => applyTheme(theme))

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark"

    // A View Transition fotografa a tela antes do callback e faz o cross-fade
    // para o que existir quando ele terminar — por isso o estado do React e o
    // `data-theme` precisam mudar de forma síncrona lá dentro (`flushSync`).
    function commit() {
      flushSync(() => setTheme(next))
      applyTheme(next)
    }

    if (typeof document.startViewTransition !== "function" || prefersReducedMotion()) {
      commit()
      return
    }
    document.startViewTransition(commit)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}
