import { AnimatePresence } from "motion/react"
import type { ReactNode } from "react"
import { createPortal } from "react-dom"

import { ModalPanel } from "./ModalPanel"

export type ModalVariant = "default" | "danger" | "warning"
export type ModalSize = "sm" | "lg" | "xl" | "2xl"

export interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  icon?: ReactNode
  variant?: ModalVariant
  size?: ModalSize
  /** Ações alinhadas à direita, sobre faixa `raised` fixa no rodapé. */
  footer?: ReactNode
  children?: ReactNode
}

/**
 * Modal (DS v2): fundo `bg` a 40% com blur de 3px, painel `surface` com
 * `shadow-lift`, entrada com mola. Esc fecha e o foco volta para quem abriu.
 * Confirmação só para o que não dá para desfazer — o resto usa Desfazer no
 * toast.
 */
export function Modal({ open, ...props }: ModalProps) {
  return createPortal(
    <AnimatePresence>{open && <ModalPanel key="modal" {...props} />}</AnimatePresence>,
    document.body,
  )
}
