import { motion } from "motion/react"
import { useTranslation } from "react-i18next"

import type { StageSummary } from "@/pages/projetos/hooks/useProjectProgress"

import { ganttScale } from "./ganttScale"
import { GanttLegend } from "./GanttLegend"
import { GanttRow } from "./GanttRow"

interface GanttProps {
  stages: StageSummary[]
  /** Clique numa etapa (nome ou barra) — abre a edição ou leva a Etapas. */
  onSelect?: (stage: StageSummary) => void
}

/**
 * Cronograma (DS v2): etapas como barras sobre uma régua de meses, com a linha
 * "hoje" em ouro. Cada barra cresce da esquerda com 45ms de atraso por linha;
 * a linha hoje desce de cima. Em telas estreitas o nome vai para cima da barra.
 * A legenda fica sempre visível.
 */
export function Gantt({ stages, onSelect }: GanttProps) {
  const { t, i18n } = useTranslation()
  const scale = ganttScale(stages)

  if (!scale) return <p className="py-8 text-center text-[14px] text-ink-3">{t("obra.gantt.empty")}</p>

  return (
    <div>
      <div className="relative pb-7">
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,200px)_1fr] sm:gap-x-4">
          <div className="hidden sm:block" />
          <div className="relative h-7 border-b border-border">
            {scale.months.map((m) => (
              <span
                key={m.x}
                className="t-num absolute bottom-1.5 -translate-x-1/2 text-[11px] text-ink-3 first-letter:uppercase"
                style={{ left: `${m.x}%` }}
              >
                {m.date.toLocaleDateString(i18n.language, { month: "short" }).replace(".", "")}
                {m.date.getMonth() === 0 && ` ${String(m.date.getFullYear()).slice(2)}`}
              </span>
            ))}
          </div>

          {stages.map((stage, index) => (
            <GanttRow key={stage.id} stage={stage} index={index} scale={scale} onSelect={onSelect} />
          ))}
        </div>

        <div className="pointer-events-none absolute top-7 right-0 bottom-7 left-0 sm:left-[216px]">
          <motion.div
            className="absolute inset-y-0 w-px origin-top bg-gold"
            style={{ left: `${scale.today}%` }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="absolute -bottom-[22px] left-1/2 -translate-x-1/2 rounded-pill bg-gold px-1.5 py-px text-[10.5px] font-[650] text-on-gold">
              {t("obra.gantt.today")}
            </span>
          </motion.div>
        </div>
      </div>
      <GanttLegend />
    </div>
  )
}
