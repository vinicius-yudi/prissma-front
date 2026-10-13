import { createContext, useContext } from "react"

export interface CommandPaletteValue {
  open: () => void
}

export const CommandPaletteContext = createContext<CommandPaletteValue | null>(null)

/** Abre a busca ⌘K. Fora do provider (telas públicas) vira no-op. */
export function useCommandPalette(): CommandPaletteValue {
  return useContext(CommandPaletteContext) ?? { open: () => {} }
}
