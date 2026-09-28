import { Search } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Kbd } from "@/shared/components/ui/kbd/Kbd"

import { useCommandPalette } from "../command-palette/commandPaletteContext"

/**
 * Gatilho da busca global na barra superior (DS v2, Search): 40px, `surface`
 * com hairline, atalho ⌘K. No mobile o texto encurta e o atalho some.
 */
export function SearchTrigger() {
  const { t } = useTranslation()
  const { open } = useCommandPalette()

  return (
    <button
      type="button"
      onClick={open}
      aria-label={t("palette.label")}
      className="flex h-10 min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-md bg-surface px-3.5 text-left text-[14px] text-meta transition-shadow hairline hover:inset-ring-border-strong sm:max-w-[420px]"
    >
      <Search size={16} className="flex-none" />
      <span className="flex-1 truncate">
        <span className="sm:hidden">{t("palette.triggerShort")}</span>
        <span className="hidden sm:inline">{t("palette.trigger")}</span>
      </span>
      <span className="hidden items-center gap-1 sm:flex" aria-hidden="true">
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </span>
    </button>
  )
}
