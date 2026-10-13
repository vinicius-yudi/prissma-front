import { AnimatePresence } from "motion/react"
import { useState } from "react"
import type { ReactNode } from "react"
import { createPortal } from "react-dom"

import { useMountEffect } from "@/shared/hooks/useMountEffect"

import { CommandPaletteContext } from "./commandPaletteContext"
import { CommandPalettePanel } from "./CommandPalettePanel"

interface CommandPaletteProviderProps {
  children: ReactNode
}

/**
 * Busca global ⌘K / Ctrl+K do shell autenticado. O atalho é o único ouvinte
 * global: sincroniza com o teclado do sistema, fora do modelo do React, por
 * isso vive num `useMountEffect`.
 */
export function CommandPaletteProvider({ children }: CommandPaletteProviderProps) {
  const [open, setOpen] = useState(false)

  useMountEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }
    window.addEventListener("keydown", handleShortcut)
    return () => window.removeEventListener("keydown", handleShortcut)
  })

  return (
    <CommandPaletteContext.Provider value={{ open: () => setOpen(true) }}>
      {children}
      {createPortal(
        <AnimatePresence>
          {open && <CommandPalettePanel key="palette" onClose={() => setOpen(false)} />}
        </AnimatePresence>,
        document.body,
      )}
    </CommandPaletteContext.Provider>
  )
}
