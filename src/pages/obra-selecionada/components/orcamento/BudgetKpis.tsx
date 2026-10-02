import { TrendingUp } from "lucide-react"
import { useTranslation } from "react-i18next"

import { KpiCard } from "@/shared/components/ui/kpi-card/KpiCard"
import { KpiStrip } from "@/shared/components/ui/kpi-card/KpiStrip"
import { Progress } from "@/shared/components/ui/progress/Progress"
import { Ticker } from "@/shared/components/ui/ticker/Ticker"
import type { ProjectBudget } from "@/shared/types/budget"
import { formatCompactCurrency } from "@/shared/utils/formatters"

import { calculatePercent, projectEnd, type ProjectionTrend } from "../../utils/budgetMath"

const TREND_KEY: Record<ProjectionTrend, string> = {
  above: "obra.orcamento.kpi.projectionAbove",
  below: "obra.orcamento.kpi.projectionBelow",
  within: "obra.orcamento.kpi.projectionWithin",
}

interface BudgetKpisProps {
  budget: ProjectBudget
  /** Avanço físico 0–100 da obra em andamento; `null` fora de andamento. */
  progress: number | null
}

/** Orçado, gasto (com a trena contra o avanço físico), saldo e projeção. */
export function BudgetKpis({ budget, progress }: BudgetKpisProps) {
  const { t } = useTranslation()
  const usedPercent = calculatePercent(budget.totalSpent, budget.plannedTotal)
  const projection = projectEnd(budget.totalSpent, budget.plannedTotal, progress)

  return (
    <KpiStrip>
      <KpiCard bare label={t("obra.orcamento.kpi.planned")} value={formatCompactCurrency(budget.plannedTotal)}>
        {t("obra.orcamento.kpi.categories", { count: budget.items.length })}
      </KpiCard>

      <KpiCard bare label={t("obra.orcamento.kpi.spent")} value={<Ticker value={budget.totalSpent} format={formatCompactCurrency} />}>
        <Progress
          value={usedPercent}
          expected={progress ?? undefined}
          height={6}
          tone={budget.exceeded ? "danger" : "gold"}
          label={t("obra.orcamento.kpi.used", { percent: Math.round(usedPercent) })}
          className="mt-1"
        />
      </KpiCard>

      <KpiCard bare label={t("obra.orcamento.kpi.remaining")} value={formatCompactCurrency(budget.remaining)} danger={budget.remaining < 0}>
        {t("obra.orcamento.kpi.available", { percent: Math.max(0, Math.round(100 - usedPercent)) })}
      </KpiCard>

      <KpiCard
        bare
        label={t("obra.orcamento.kpi.projection")}
        value={projection ? formatCompactCurrency(projection.value) : "—"}
        danger={projection?.trend === "above"}
      >
        <span className="inline-flex items-center gap-1.5">
          <TrendingUp size={13} aria-hidden="true" />
          {projection
            ? t(TREND_KEY[projection.trend], { percent: Math.round(Math.abs(projection.diff) * 100) })
            : t("obra.orcamento.kpi.projectionUnavailable")}
        </span>
      </KpiCard>
    </KpiStrip>
  )
}
