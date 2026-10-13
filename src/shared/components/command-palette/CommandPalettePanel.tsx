import { Search } from "lucide-react"
import { motion } from "motion/react"
import { useState } from "react"
import type { ChangeEvent, KeyboardEvent } from "react"
import { useTranslation } from "react-i18next"

import { Kbd } from "@/shared/components/ui/kbd/Kbd"
import { SPRING } from "@/shared/constants/motion"
import { useOverlayLifecycle } from "@/shared/hooks/useOverlayLifecycle"

import { CommandItem } from "./CommandItem"
import { filterCommands } from "./commandSearch"
import { useCommands } from "./useCommands"

interface CommandPalettePanelProps {
  onClose: () => void
}

/**
 * Painel ⌘K (DS v2, Search): campo de 56px, resultados agrupados por tipo,
 * setas movem o destaque, Enter executa, Esc fecha. Só existe montado enquanto
 * aberto — o termo e a seleção recomeçam a cada abertura.
 */
export function CommandPalettePanel({ onClose }: CommandPalettePanelProps) {
  const { t } = useTranslation()
  const { panelRef, handleKeyDown } = useOverlayLifecycle<HTMLDivElement>(onClose)
  const [query, setQuery] = useState("")
  const [index, setIndex] = useState(0)

  const results = filterCommands(useCommands(query, onClose), query)
  const safeIndex = Math.min(index, Math.max(0, results.length - 1))

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setQuery(event.target.value)
    setIndex(0)
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setIndex(Math.min(results.length - 1, safeIndex + 1))
    }
    if (event.key === "ArrowUp") {
      event.preventDefault()
      setIndex(Math.max(0, safeIndex - 1))
    }
    if (event.key === "Enter") {
      event.preventDefault()
      results[safeIndex]?.run()
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-(--z-palette) flex items-start justify-center bg-bg/40 p-3 pt-[12vh] backdrop-blur-[3px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("palette.label")}
        tabIndex={-1}
        initial={{ y: -16, scale: 0.98, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: -10, scale: 0.98, opacity: 0 }}
        transition={SPRING}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleKeyDown}
        className="relative w-full max-w-[620px] overflow-hidden rounded-[18px] bg-surface shadow-lift outline-none hairline"
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search size={18} className="text-meta" />
          <input
            autoFocus
            value={query}
            onChange={handleChange}
            onKeyDown={handleInputKeyDown}
            placeholder={t("palette.placeholder")}
            aria-label={t("palette.label")}
            // outline-none! vence o anel global de :focus-visible (index.css), que
            // fica fora das camadas do Tailwind: o painel inteiro já é o destaque.
            className="h-14 flex-1 bg-transparent text-[16px] text-ink outline-none! placeholder:text-ink-3"
          />
          <Kbd>esc</Kbd>
        </div>

        <div className="max-h-[52vh] overflow-y-auto p-2" role="listbox" aria-label={t("palette.label")}>
          {results.length === 0 && (
            <p className="px-3 py-10 text-center text-[14px] text-meta">{t("palette.empty", { term: query })}</p>
          )}
          {results.map((command, i) => (
            <div key={command.id}>
              {command.group !== results[i - 1]?.group && (
                <p className="px-3 pt-3 pb-1.5 text-[12px] font-semibold text-meta">{command.group}</p>
              )}
              <CommandItem command={command} active={i === safeIndex} onHover={() => setIndex(i)} />
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
