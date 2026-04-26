import type { CSSProperties } from "react"
import { Moon, Sun } from "lucide-react"

import { useTheme } from "@/contexts/ThemeContext"

const LABEL_DARK = "Ativar modo claro"
const LABEL_LIGHT = "Ativar modo escuro"

const KNOB_STYLE_DARK: CSSProperties = { transform: "translateX(0)" }
const KNOB_STYLE_LIGHT: CSSProperties = { transform: "translateX(1.25rem)" }

function getAriaLabel(isDark: boolean): string {
  if (isDark) return LABEL_DARK
  return LABEL_LIGHT
}

function getKnobStyle(isDark: boolean): CSSProperties {
  if (isDark) return KNOB_STYLE_DARK
  return KNOB_STYLE_LIGHT
}

function ToggleIcon({ isDark }: { isDark: boolean }) {
  if (isDark) return <Moon size={14} className="text-on-primary" />
  return <Sun size={14} className="text-on-primary" />
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === "dark"

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={getAriaLabel(isDark)}
      className="relative flex h-8 w-[3.25rem] shrink-0 items-center rounded-full border border-outline-variant bg-surface-container-high p-0.5 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
    >
      <span
        className="absolute left-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-primary shadow-sm transition-all duration-300"
        style={getKnobStyle(isDark)}
      >
        <ToggleIcon isDark={isDark} />
      </span>
    </button>
  )
}
