import { AlertTriangle, Coins, TrendingDown, TrendingUp } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { ProjectBudget } from "@/shared/types/budget"
import { formatCurrency } from "@/shared/utils/formatters"

import { calculatePercent, resolveBudgetTone } from "../utils/budgetMath"
import { BudgetKpiCard, type BudgetKpiAccent } from "./BudgetKpiCard"
import { BudgetProgressBar } from "./BudgetProgressBar"

interface BudgetKpiStripProps {
  budget: ProjectBudget
}

function toneToAccent(percent: number, exceeded: boolean): BudgetKpiAccent {
  const tone = resolveBudgetTone(percent, exceeded)
  if (tone === "exceeded") return "danger"
  if (tone === "warning") return "warning"
  return "default"
}

export function BudgetKpiStrip({ budget }: BudgetKpiStripProps) {
  const { t } = useTranslation()
  const usedPercent = calculatePercent(budget.totalSpent, budget.plannedTotal)
  const spentAccent = toneToAccent(usedPercent, budget.exceeded)
  const exceededCount = budget.items.filter((i) => i.exceeded).length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <BudgetKpiCard
          label={t("obra.orcamento.kpi.planned")}
          value={formatCurrency(budget.plannedTotal)}
          icon={<Coins size={16} />}
        />
        <BudgetKpiCard
          label={t("obra.orcamento.kpi.spent")}
          value={formatCurrency(budget.totalSpent)}
          icon={<TrendingUp size={16} />}
          accent={spentAccent}
        />
        <BudgetKpiCard
          label={t("obra.orcamento.kpi.remaining")}
          value={formatCurrency(budget.remaining)}
          icon={<TrendingDown size={16} />}
          accent={budget.remaining < 0 ? "danger" : "default"}
        />
        <BudgetKpiCard
          label={t("obra.orcamento.kpi.exceeded")}
          value={exceededCount}
          icon={<AlertTriangle size={16} />}
          accent={exceededCount > 0 ? "danger" : "default"}
          hint={
            exceededCount > 0
              ? t("obra.orcamento.kpi.exceededOther", { count: exceededCount })
              : null
          }
        />
      </div>

      <div className="space-y-2">
        <BudgetProgressBar percent={usedPercent} exceeded={budget.exceeded} height="lg" />
        <p className="text-xs text-on-surface-variant text-right tabular-nums">
          {t("obra.orcamento.kpi.used", { percent: Math.round(usedPercent) })}
        </p>
      </div>
    </div>
  )
}
