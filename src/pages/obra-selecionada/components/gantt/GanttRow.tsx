import { AnimatePresence, motion } from "motion/react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import type { StageSummary } from "@/pages/projetos/hooks/useProjectProgress"
import { EtapaStatus } from "@/pages/projetos/types"
import { startOfLocalDay } from "@/shared/utils/status"

import type { GanttScale } from "./ganttScale"

const bar = tv({
  base: "absolute top-1/2 h-[18px] origin-left -translate-y-1/2 overflow-hidden rounded-xs",
  variants: {
    state: {
      DONE: "bg-success/85",
      IN_PROGRESS: "bg-gold-soft inset-ring inset-ring-gold",
      PLANNED: "border border-dashed border-border-strong bg-surface",
      BLOCKED: "bg-warning-soft inset-ring inset-ring-warning",
    },
    late: { true: "inset-ring-[1.5px] inset-ring-danger" },
    clickable: { true: "cursor-pointer" },
  },
})

const fill = tv({
  base: "absolute inset-y-0 left-0",
  variants: { late: { true: "bg-danger", false: "bg-gold" } },
})

const label = tv({
  base: "truncate text-[13px]",
  variants: {
    late: { true: "text-danger", false: "" },
    hovered: { true: "text-ink", false: "text-ink-2" },
  },
})

interface GanttRowProps {
  stage: StageSummary
  index: number
  scale: GanttScale
  onSelect?: (stage: StageSummary) => void
}

/**
 * Uma etapa no cronograma (DS v2): concluída em `success`; em andamento em
 * `gold-soft` com o avanço real preenchido; planejada só tracejada; pausada em
 * `warning`; atrasada com contorno `danger` e o trecho entre o fim previsto e
 * hoje em listras. Hover mostra a dica na superfície `inverse`.
 */
export function GanttRow({ stage, index, scale, onSelect }: GanttRowProps) {
  const { t, i18n } = useTranslation()
  const [hover, setHover] = useState(false)
  const start = startOfLocalDay(stage.plannedStartDate)
  const end = startOfLocalDay(stage.plannedEndDate)
  const late = stage.daysLate > 0
  const format = (d: Date) => d.toLocaleDateString(i18n.language, { day: "2-digit", month: "short" }).replace(".", "")
  const statusText = late ? t("status.LATE") : t(`status.${stage.status}`)

  const a = start ? scale.pos(start) : 0
  const b = end ? scale.pos(end) : 0

  return (
    <div className="contents" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <button
        type="button"
        onClick={() => onSelect?.(stage)}
        className="flex min-h-10 min-w-0 cursor-pointer items-center gap-2 pt-3 text-left sm:pt-0"
      >
        <span className="t-num w-5 flex-none text-[11.5px] text-meta">{String(index + 1).padStart(2, "0")}</span>
        <span className={label({ late, hovered: hover })}>{stage.name}</span>
      </button>

      <div className="relative h-10">
        {scale.months.map((m) => (
          <span key={m.x} className="absolute inset-y-0 w-px bg-border/60" style={{ left: `${m.x}%` }} />
        ))}
        {hover && <span className="absolute inset-0 -mx-1 rounded-[6px] bg-raised" />}

        {start && end && (
          <>
            {late && (
              <motion.span
                className="hazard absolute top-1/2 h-3 -translate-y-1/2 rounded-r-[4px]"
                style={{ left: `${b}%`, width: `${Math.max(0, scale.today - b)}%` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + index * 0.04 }}
              />
            )}
            <motion.button
              type="button"
              onClick={() => onSelect?.(stage)}
              aria-label={t("obra.gantt.barLabel", { name: stage.name, start: format(start), end: format(end), status: statusText })}
              className={bar({ state: stage.status, late, clickable: !!onSelect })}
              style={{ left: `${a}%`, width: `${Math.max(1.2, b - a)}%` }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ type: "spring", stiffness: 120, damping: 20, delay: 0.1 + index * 0.045 }}
            >
              {stage.status === EtapaStatus.IN_PROGRESS && (
                <motion.span
                  className={fill({ late })}
                  initial={{ width: 0 }}
                  animate={{ width: `${stage.progress}%` }}
                  transition={{ type: "spring", stiffness: 60, damping: 18, delay: 0.4 + index * 0.05 }}
                />
              )}
            </motion.button>

            <AnimatePresence>
              {hover && (
                <motion.div
                  role="tooltip"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                  className="pointer-events-none absolute bottom-full z-20 mb-0.5 -translate-x-1/2 rounded-[8px] bg-inverse px-2.5 py-1.5 text-[12px] whitespace-nowrap text-on-inverse shadow-lift"
                  style={{ left: `${Math.min(88, Math.max(12, (a + b) / 2))}%` }}
                >
                  <span className="t-num font-[620]">
                    {format(start)} → {format(end)}
                  </span>
                  <span className="opacity-70">
                    {" · "}
                    {statusText.toLowerCase()} · {stage.progress}%
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  )
}
