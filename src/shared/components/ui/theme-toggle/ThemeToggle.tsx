import { Moon, Sun } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useTranslation } from "react-i18next"

import { useTheme } from "@/contexts/ThemeContext"

import { IconButton } from "../icon-button/IconButton"

/**
 * Alterna Barroco (escuro) e Canteiro (claro). O rótulo anuncia o destino,
 * não o estado atual; o ícone mostra o tema atual e gira ao trocar.
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const { t } = useTranslation()
  const isDark = theme === "dark"

  return (
    <IconButton label={isDark ? t("header.themeLight") : t("header.themeDark")} onClick={toggleTheme}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          data-theme-icon={theme}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="flex"
        >
          {isDark ? <Moon size={18} /> : <Sun size={18} />}
        </motion.span>
      </AnimatePresence>
    </IconButton>
  )
}
