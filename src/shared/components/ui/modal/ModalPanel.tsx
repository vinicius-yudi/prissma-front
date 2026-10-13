import { X } from "lucide-react"
import { motion } from "motion/react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { SPRING } from "@/shared/constants/motion"
import { useOverlayLifecycle } from "@/shared/hooks/useOverlayLifecycle"

import { IconButton } from "../icon-button/IconButton"
import type { ModalProps } from "./Modal"

const iconWrap = tv({
  base: "flex size-10 flex-none items-center justify-center rounded-[10px]",
  variants: {
    variant: {
      default: "bg-gold-soft text-gold-hi",
      danger: "bg-danger-soft text-danger",
      warning: "bg-warning-soft text-warning",
    },
  },
})

/**
 * Abaixo de `sm` o modal vira folha ancorada no rodapé: no celular um diálogo
 * centralizado deixa faixas mortas, e o polegar alcança o rodapé. `dvh`
 * porque o teclado virtual encolhe a viewport.
 */
const panel = tv({
  base: [
    "relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[22px] bg-surface pb-safe shadow-lift hairline outline-none",
    "sm:max-h-[90vh] sm:rounded-[20px] sm:pb-0",
  ],
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

type ModalPanelProps = Omit<ModalProps, "open">


/** Painel do modal — só existe montado enquanto o modal está aberto. */
export function ModalPanel({
  onClose,
  title,
  description,
  icon,
  variant = "default",
  size = "lg",
  footer,
  children,
}: ModalPanelProps) {
  const { t } = useTranslation()
  const { panelRef, handleKeyDown } = useOverlayLifecycle<HTMLDivElement>(onClose)

  return (
    <motion.div
      className="fixed inset-0 z-(--z-modal) flex items-end justify-center bg-bg/40 backdrop-blur-[3px] sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={panel({ size })}
        initial={{ y: 40, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 24, opacity: 0, scale: 0.98 }}
        transition={SPRING}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Alça da folha: sinaliza que o painel é descartável. */}
        <div className="mx-auto mt-2 h-1 w-10 flex-none rounded-full bg-border-strong sm:hidden" />

        <header className="flex flex-none items-start justify-between gap-4 px-6 pt-5 pb-4 sm:pt-6">
          <div className="flex min-w-0 items-center gap-3">
            {icon && <div className={iconWrap({ variant })}>{icon}</div>}
            <div className="min-w-0">
              <h2 className="t-title-sm text-[22px] text-ink">{title}</h2>
              {description && <p className="mt-1 text-[14px] text-ink-2">{description}</p>}
            </div>
          </div>
          <IconButton label={t("common.close")} onClick={onClose} className="-mt-1 -mr-2">
            <X size={18} />
          </IconButton>
        </header>

        <div className="flex-1 overflow-y-auto">{children}</div>

        {footer && (
          <footer className="flex flex-none items-center justify-end gap-2 border-t border-border bg-raised/60 px-6 py-4">
            {footer}
          </footer>
        )}
      </motion.div>
    </motion.div>
  )
}
