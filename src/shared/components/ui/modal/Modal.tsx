import { X } from "lucide-react"
import { type ReactNode, useEffect } from "react"
import { createPortal } from "react-dom"
import { tv } from "tailwind-variants"

export type ModalVariant = "default" | "danger" | "warning"
export type ModalSize = "sm" | "lg" | "xl" | "2xl"

const accentBar = tv({
  base: "h-1.5 w-full flex-none",
  variants: {
    variant: {
      default: "bg-primary",
      danger: "bg-error",
      warning: "bg-tertiary",
    },
  },
})

const iconWrap = tv({
  base: "p-2.5 rounded-xl flex items-center justify-center flex-none",
  variants: {
    variant: {
      default: "bg-primary/15 text-primary",
      danger: "bg-error/15 text-error",
      warning: "bg-tertiary/15 text-tertiary",
    },
  },
})

/**
 * Abaixo de `sm` o modal vira folha ancorada no rodapé: no celular um diálogo
 * centralizado deixa faixas mortas em cima e embaixo, e o polegar alcança o
 * rodapé, não o meio da tela. `dvh` porque o teclado virtual encolhe a viewport
 * e `90vh` continuaria contando a altura antiga.
 */
const container = tv({
  base: "w-full bg-surface-container border border-outline-variant rounded-t-2xl shadow-2xl flex flex-col max-h-[92dvh] pb-safe overflow-hidden sm:rounded-2xl sm:max-h-[90vh] sm:pb-0",
  variants: {
    size: {
      sm: "sm:max-w-sm",
      lg: "sm:max-w-lg",
      xl: "sm:max-w-xl",
      "2xl": "sm:max-w-2xl",
    },
  },
  defaultVariants: {
    size: "lg",
  },
})

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  icon?: ReactNode
  variant?: ModalVariant
  size?: ModalSize
  children?: ReactNode
}

export function Modal({
  open,
  onClose,
  title,
  description,
  icon,
  variant = "default",
  size = "lg",
  children,
}: ModalProps) {
  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, onClose])

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div className={container({ size })} onClick={(e) => e.stopPropagation()}>
        <div className={accentBar({ variant })} />

        {/* Alça da folha: sinaliza que o painel é arrastável/descartável. */}
        <div className="mx-auto mt-2 h-1 w-10 flex-none rounded-full bg-outline sm:hidden" />

        <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-4 flex-none">
          <div className="flex items-center gap-3 min-w-0">
            {icon && <div className={iconWrap({ variant })}>{icon}</div>}
            <div className="min-w-0">
              <h2 className="text-base font-bold text-on-surface leading-snug">{title}</h2>
              {description && (
                <p className="text-sm text-on-surface-variant mt-0.5">{description}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors flex-none cursor-pointer sm:min-h-0 sm:min-w-0 sm:mt-0.5 sm:p-1.5"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
