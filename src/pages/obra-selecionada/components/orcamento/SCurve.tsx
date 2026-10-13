import { AnimatePresence, motion } from "motion/react"
import { useState } from "react"
import type { PointerEvent } from "react"
import { useTranslation } from "react-i18next"

import { EASE_OUT_EXPO } from "@/shared/constants/motion"
import { formatCompactCurrency, formatDate } from "@/shared/utils/formatters"

import { CURVE_BOX, type CurveGeometry } from "../../utils/sCurve"

const { width: W, height: H, left, right, top, bottom } = CURVE_BOX

interface SCurveProps {
  curve: CurveGeometry
  planned: number
}

/**
 * Curva de gastos: gasto acumulado (ouro, em degraus) sobre a curva S
 * planejada (tracejada), com a linha do orçado e o ponto de hoje. Passar o
 * ponteiro lê planejado e gasto naquela data.
 */
export function SCurve({ curve, planned }: SCurveProps) {
  const { t, i18n } = useTranslation()
  const [hoverX, setHoverX] = useState<number | null>(null)
  const reading = hoverX === null ? null : curve.valueAt(hoverX)

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    const box = event.currentTarget.getBoundingClientRect()
    const ratio = (event.clientX - box.left) / box.width
    if (!Number.isFinite(ratio)) return
    setHoverX(Math.max(left, Math.min(W - right, ratio * W)))
  }

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none"
        role="img"
        aria-label={t("obra.orcamento.curve.label")}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverX(null)}
      >
        <defs>
          <linearGradient id="s-curve-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--gold)" stopOpacity="0.22" />
            <stop offset="1" stopColor="var(--gold)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {curve.months.map((month) => (
          <g key={month.x}>
            <line x1={month.x} x2={month.x} y1={top} y2={H - bottom} stroke="var(--border)" />
            <text x={month.x} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--ink-3)">
              {month.date.toLocaleDateString(i18n.language, { month: "short" }).replace(".", "")}
            </text>
          </g>
        ))}
        <line x1={left} x2={W - right} y1={curve.budgetY} y2={curve.budgetY} stroke="var(--ink-3)" strokeDasharray="4 4" />
        <text x={W - right} y={curve.budgetY - 6} textAnchor="end" fontSize="11" fill="var(--ink-3)">
          {t("obra.orcamento.curve.budgetLine", { value: formatCompactCurrency(planned) })}
        </text>
        <motion.path d={curve.planned} fill="none" stroke="var(--ink-3)" strokeWidth="1.5" strokeDasharray="5 4" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2, ease: EASE_OUT_EXPO }} />
        <motion.path d={curve.area} fill="url(#s-curve-fill)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} />
        <motion.path d={curve.actual} fill="none" stroke="var(--gold)" strokeWidth="2.5" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, ease: EASE_OUT_EXPO, delay: 0.15 }} />
        <line x1={curve.nowX} x2={curve.nowX} y1={top} y2={H - bottom} stroke="var(--gold)" strokeOpacity="0.4" />
        <motion.circle cx={curve.nowX} cy={curve.spentY} r="5" fill="var(--gold)" stroke="var(--surface)" strokeWidth="2" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.3, type: "spring" }} />
        {hoverX !== null && <line x1={hoverX} x2={hoverX} y1={top} y2={H - bottom} stroke="var(--ink)" strokeOpacity="0.35" />}
      </svg>

      <AnimatePresence>
        {reading && hoverX !== null && (
          <motion.div
            role="tooltip"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-[10px] bg-inverse px-3 py-2 text-[12px] whitespace-nowrap text-on-inverse shadow-lift"
            style={{ left: `${Math.min(85, Math.max(15, (hoverX / W) * 100))}%` }}
          >
            <p className="font-[640]">{formatDate(reading.date.toISOString())}</p>
            <p className="t-num opacity-80">{t("obra.orcamento.curve.plannedAt", { value: formatCompactCurrency(reading.planned) })}</p>
            {!reading.future && <p className="t-num">{t("obra.orcamento.curve.spentAt", { value: formatCompactCurrency(reading.spent) })}</p>}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-meta">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-[3px] w-5 rounded-pill bg-gold" />
          {t("obra.orcamento.curve.actualLegend")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0 w-5 border-t-2 border-dashed border-ink-3" />
          {t("obra.orcamento.curve.plannedLegend")}
        </span>
      </div>
    </div>
  )
}
