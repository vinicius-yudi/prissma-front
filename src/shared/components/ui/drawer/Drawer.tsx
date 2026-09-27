import { AnimatePresence } from "motion/react"
import type { ReactNode } from "react"
import { createPortal } from "react-dom"

import { DrawerPanel } from "./DrawerPanel"

export interface DrawerProps {
  open: boolean
  onClose: () => void
  /** Nome acessível do painel. */
  label: string
  /** Largura máxima em px; no mobile ocupa a tela toda. */
  width?: number
  children: ReactNode
}

/**
 * Painel lateral direito (drawer de tarefa). Mesmo contrato do Modal: Esc
 * fecha, o foco volta para quem abriu, o fundo fica travado.
 */
export function Drawer({ open, ...props }: DrawerProps) {
  return createPortal(
    <AnimatePresence>{open && <DrawerPanel key="drawer" {...props} />}</AnimatePresence>,
    document.body,
  )
}
