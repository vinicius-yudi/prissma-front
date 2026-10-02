import { AlertTriangle } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { formatCurrency } from "@/shared/utils/formatters"

import type { ExpenseImpact as Impact } from "../../hooks/useExpenseForm"

const box = tv({
  base: "rounded-[14px] p-4 transition-colors",
  variants: { exceed: { true: "bg-danger-soft", false: "bg-raised" } },
})

const percent = tv({
  base: "t-num font-[680]",
  variants: { exceed: { true: "text-danger", false: "text-ink" } },
})

const added = tv({
  base: "absolute inset-y-0",
  variants: { exceed: { true: "bg-danger", false: "bg-gold" } },
})

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value))
}

/** Prévia da categoria depois do lançamento: o já gasto e o que entra. */
export function ExpenseImpact({ impact }: { impact: Impact }) {
  const { t } = useTranslation()
  const { item, beforePercent, afterPercent, remainingAfter, willExceed } = impact
  const before = clamp(beforePercent)

  return (
    <motion.div layout className={box({ exceed: willExceed })} aria-live="polite">
      <div className="flex items-center justify-between gap-3 text-[13px]">
        <span className="font-[600] text-ink">{t("obra.orcamento.impact.title", { category: item.category })}</span>
        <span className={percent({ exceed: willExceed })}>{Math.round(afterPercent)}%</span>
      </div>
      <div className="relative mt-2.5 h-2.5 overflow-hidden rounded-[3px] bg-border">
        <motion.div className="absolute inset-y-0 left-0 bg-ink/30" animate={{ width: `${before}%` }} />
        <motion.div
          className={added({ exceed: willExceed })}
          animate={{ left: `${before}%`, width: `${Math.max(0, clamp(afterPercent) - before)}%` }}
          transition={{ type: "spring", stiffness: 200, damping: 26 }}
        />
      </div>
      <AnimatePresence initial={false} mode="wait">
        {willExceed ? (
          <motion.p key="over" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2.5 flex items-start gap-2 text-[12.5px] font-[580] text-danger">
            <AlertTriangle size={14} className="mt-0.5 flex-none" />
            {t("obra.orcamento.impact.over", { value: formatCurrency(-remainingAfter) })}
          </motion.p>
        ) : (
          <motion.p key="ok" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-2.5 text-[12.5px] text-ink-2">
            {t("obra.orcamento.impact.remaining", { value: formatCurrency(remainingAfter), planned: formatCurrency(item.plannedAmount) })}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
