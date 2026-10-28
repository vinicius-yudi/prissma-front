import type { Ref } from "react"
import { useTranslation } from "react-i18next"

import type { AnalyticsDashboard } from "../types/analytics"
import { buildMemberEffort } from "../utils/analyticsData"
import { PDF_BLOCK_ATTR } from "../utils/dashboardPdf"
import { AnalyticsKpis } from "./AnalyticsKpis"
import { ChartCard } from "./ChartCard"
import { BudgetCurveChart } from "./charts/BudgetCurveChart"
import { BurndownChart } from "./charts/BurndownChart"
import { ExpensesByCategoryChart } from "./charts/ExpensesByCategoryChart"
import { MemberEffortChart } from "./charts/MemberEffortChart"
import { OverdueStagesTable } from "./OverdueStagesTable"

/** Cada card é um bloco do PDF: pula de página inteiro, nunca cortado ao meio. */
const PDF_BLOCK = { [PDF_BLOCK_ATTR]: "" }

interface AnalyticsSheetProps {
  data: AnalyticsDashboard
  /** Consolidado: as linhas da tabela dizem de qual obra são, e o burndown ganha a ressalva da soma. */
  showProject: boolean
  /** A folha inteira — é dela que o export em PDF clona os blocos. */
  ref: Ref<HTMLDivElement>
}

/** Os blocos do dashboard, na ordem do protótipo da especificação. */
export function AnalyticsSheet({ data, showProject, ref }: AnalyticsSheetProps) {
  const { t } = useTranslation()
  const members = buildMemberEffort(data.memberEffort)

  function emptyWhen(isEmpty: boolean, key: string): string | null {
    return isEmpty ? t(key) : null
  }

  return (
    <div ref={ref} className="flex flex-col gap-6">
      <div {...PDF_BLOCK}>
        <AnalyticsKpis summary={data.summary} />
      </div>

      <div {...PDF_BLOCK}>
        <ChartCard title={t("relatorios.charts.budget.title")} emptyText={emptyWhen(data.budgetMonthly.length === 0, "relatorios.charts.budget.empty")}>
          <BudgetCurveChart points={data.budgetMonthly} />
        </ChartCard>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <div {...PDF_BLOCK}>
          <ChartCard title={t("relatorios.charts.expenses.title")} emptyText={emptyWhen(data.expensesByCategory.length === 0, "relatorios.charts.expenses.empty")}>
            <ExpensesByCategoryChart lines={data.expensesByCategory} />
          </ChartCard>
        </div>
        <div {...PDF_BLOCK}>
          <ChartCard title={t("relatorios.charts.burndown.title")} emptyText={emptyWhen(data.burndown.length === 0, "relatorios.charts.burndown.empty")}>
            <BurndownChart points={data.burndown} consolidated={showProject} />
          </ChartCard>
        </div>
      </div>

      <div {...PDF_BLOCK}>
        <ChartCard
          title={t("relatorios.overdue.title")}
          meta={data.overdueStages.length}
          emptyText={emptyWhen(data.overdueStages.length === 0, "relatorios.overdue.empty")}
        >
          <OverdueStagesTable stages={data.overdueStages} showProject={showProject} />
        </ChartCard>
      </div>

      <div {...PDF_BLOCK}>
        <ChartCard title={t("relatorios.charts.team.title")} meta={members.length} emptyText={emptyWhen(members.length === 0, "relatorios.charts.team.empty")}>
          <MemberEffortChart members={members} />
        </ChartCard>
      </div>
    </div>
  )
}
