import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { deriveStatus } from "@/shared/utils/status"

/**
 * Badge de status — componente único do sistema.
 *
 * Mapa fixo de cinco estados, usado por obra, etapa e tarefa. O ponto de 6px à
 * esquerda e o texto sempre presente garantem que status nunca dependa só de
 * cor (Style Guide v2 §6).
 *
 * `variant="light"` é obrigatório sobre o <ContrastCard>: as cores normais são
 * calibradas para a superfície escura e somem sobre o creme.
 */

const badge = tv({
  base: "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-[11px] py-[3px] text-[11px] font-semibold",
  variants: {
    state: {
      done: "",
      progress: "",
      late: "",
      paused: "",
      idle: "",
    },
    variant: {
      default: "",
      light: "",
    },
  },
  compoundVariants: [
    { state: "done", variant: "default", class: "bg-success-soft text-success" },
    { state: "progress", variant: "default", class: "bg-raised text-gold-hi" },
    { state: "late", variant: "default", class: "bg-danger-soft text-danger" },
    { state: "paused", variant: "default", class: "bg-warning-soft text-warning" },
    { state: "idle", variant: "default", class: "bg-raised text-ink-3" },
    // Sobre a superfície invertida: fundo translúcido do tom, texto escuro.
    { state: "done", variant: "light", class: "bg-success/15 text-success" },
    { state: "progress", variant: "light", class: "bg-on-inverse/10 text-on-inverse" },
    { state: "late", variant: "light", class: "bg-danger/15 text-danger" },
    { state: "paused", variant: "light", class: "bg-warning/20 text-warning" },
    { state: "idle", variant: "light", class: "bg-on-inverse/10 text-on-inverse/70" },
  ],
  defaultVariants: { variant: "default" },
})

const dot = tv({
  base: "size-1.5 flex-none rounded-full",
  variants: {
    state: {
      done: "bg-success",
      progress: "bg-gold-hi",
      late: "bg-danger",
      paused: "bg-warning",
      idle: "bg-ink-3",
    },
    variant: {
      default: "",
      light: "",
    },
  },
  compoundVariants: [
    { state: "progress", variant: "light", class: "bg-on-inverse" },
    { state: "late", variant: "light", class: "bg-danger" },
    { state: "idle", variant: "light", class: "bg-on-inverse/50" },
  ],
  defaultVariants: { variant: "default" },
})

interface StatusBadgeProps {
  /** Status cru da entidade (obra, etapa ou tarefa). */
  status: string
  /** Data de término planejada — é o que faz o estado "Em atraso" existir. */
  plannedEndDate?: string | null
  variant?: "default" | "light"
  className?: string
}

export function StatusBadge({
  status,
  plannedEndDate,
  variant = "default",
  className,
}: StatusBadgeProps) {
  const { t } = useTranslation()
  const { state, labelKey } = deriveStatus({ status, plannedEndDate })

  return (
    <span className={badge({ state, variant, className })}>
      <span className={dot({ state, variant })} />
      {state === "late" && <span aria-hidden="true">⚠</span>}
      {t(labelKey)}
    </span>
  )
}
