import { createContext, useContext, useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"

type Theme = "dark" | "light"

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = "prissma-theme"
const DEFAULT_THEME: Theme = "dark"

/** Precisa bater com a duração declarada em `.theme-transition` no index.css. */
const TRANSITION_CLASS = "theme-transition"
const TRANSITION_MS = 350

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === "light" || stored === "dark") return stored
  return DEFAULT_THEME
}

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  const transitionTimer = useRef<number | null>(null)

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    return () => {
      if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current)
    }
  }, [])

  function toggleTheme() {
    // A transição mora numa classe temporária, não no CSS base. Se todo
    // elemento transicionasse cor o tempo todo, hover e foco ficariam moles e
    // o primeiro paint entraria desbotando — o esmaecimento só faz sentido no
    // instante da troca.
    const root = document.documentElement
    root.classList.add(TRANSITION_CLASS)

    if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current)
    transitionTimer.current = window.setTimeout(() => {
      root.classList.remove(TRANSITION_CLASS)
      transitionTimer.current = null
    }, TRANSITION_MS)

    setTheme((prev) => (prev === "dark" ? "light" : "dark"))
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
