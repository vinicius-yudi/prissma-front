import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { deriveStatus } from "@/shared/utils/status"
import type { StatusKind } from "@/shared/utils/status"

/**
 * Pill de status — componente único do sistema (DS v2, Status).
 *
 * Cor + ponto + palavra, nunca só cor. "Em andamento" é o único status em
 * ouro e o ponto pulsa; "Bloqueada" leva listras de sinalização para não se
 * confundir com "Em atraso", que é **derivado** do prazo e substitui o status
 * real enquanto houver atraso.
 */

const badge = tv({
  base: "t-num inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-pill px-2.5 text-[12px] font-semibold",
  variants: {
    state: {
      done: "bg-success-soft text-success",
      progress: "bg-gold-soft text-gold-hi",
      late: "bg-danger-soft text-danger",
      paused: "bg-warning-soft text-warning",
      blocked: "hazard bg-danger-soft text-danger",
      idle: "bg-raised text-ink-2",
    },
  },
})

const dot = tv({
  base: "size-1.5 flex-none rounded-full bg-current",
  variants: {
    pulse: { true: "live-dot" },
  },
})

interface StatusBadgeProps {
  /** Status cru da entidade (obra, etapa ou tarefa). */
  status: string
  /** Data de término planejada — é o que faz o estado "Em atraso" existir. */
  plannedEndDate?: string | null
  /** Tarefa passa `task`: é o único caso em que `BLOCKED` vira "Bloqueada". */
  kind?: StatusKind
  className?: string
}

export function StatusBadge({ status, plannedEndDate, kind, className }: StatusBadgeProps) {
  const { t } = useTranslation()
  const { state, labelKey } = deriveStatus({ status, plannedEndDate, kind })

  return (
    <span className={badge({ state, className })}>
      <span className={dot({ pulse: state === "progress" })} />
      {t(labelKey)}
    </span>
  )
}
