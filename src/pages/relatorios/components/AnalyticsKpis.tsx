import { useTranslation } from "react-i18next"

import { KpiCard } from "@/shared/components/ui/kpi-card/KpiCard"
import { KpiStrip } from "@/shared/components/ui/kpi-card/KpiStrip"
import { formatCompactCurrency } from "@/shared/utils/formatters"

import type { AnalyticsSummary } from "../types/analytics"
import { formatPercent } from "../utils/analyticsData"

/** Os 4 KPIs do topo do dashboard (protótipo da seção 8 da especificação). */
export function AnalyticsKpis({ summary }: { summary: AnalyticsSummary }) {
  const { t, i18n } = useTranslation()
  const deviation = summary.avgDeviationDays30d
  const signed = new Intl.NumberFormat(i18n.language, { signDisplay: "exceptZero", maximumFractionDigits: 1 })

  return (
    <KpiStrip>
      <KpiCard bare label={t("relatorios.kpi.budget")} value={formatPercent(summary.budgetConsumedPct)} danger={(summary.budgetConsumedPct ?? 0) > 100}>
        {t("relatorios.kpi.budgetHint", {
          executed: formatCompactCurrency(summary.budgetExecuted),
          planned: formatCompactCurrency(summary.budgetPlanned),
        })}
      </KpiCard>
      <KpiCard bare label={t("relatorios.kpi.stages")} value={`${summary.doneStages} / ${summary.totalStages}`}>
        {t("relatorios.kpi.stagesHint", { percent: formatPercent(summary.completionPct) })}
      </KpiCard>
      <KpiCard bare label={t("relatorios.kpi.overdueTasks")} value={String(summary.overdueTasks)} danger={summary.overdueTasks > 0}>
        {t("relatorios.kpi.overdueTasksHint", { count: summary.totalTasks })}
      </KpiCard>
      <KpiCard
        bare
        label={t("relatorios.kpi.deviation")}
        value={deviation === null ? "—" : t("relatorios.kpi.deviationValue", { count: Math.abs(deviation), value: signed.format(deviation) })}
        danger={(deviation ?? 0) > 0}
      >
        {t("relatorios.kpi.deviationHint")}
      </KpiCard>
    </KpiStrip>
  )
}
