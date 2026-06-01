import { useTranslation } from "react-i18next"

import type { BudgetItem } from "@/shared/types/budget"

import { BudgetCategoryBarChart } from "./BudgetCategoryBarChart"
import { BudgetCategoryDonut } from "./BudgetCategoryDonut"
import { BudgetCategoryDonutLegend } from "./BudgetCategoryDonutLegend"
import { BudgetChartPanel } from "./BudgetChartPanel"

interface BudgetChartsProps {
  items: BudgetItem[]
}

export function BudgetCharts({ items }: BudgetChartsProps) {
  const { t } = useTranslation()

  const hasSpending = items.some((i) => i.totalSpent > 0)
  if (!hasSpending) return null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <BudgetChartPanel title={t("obra.orcamento.charts.donutTitle")}>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] items-center gap-4">
          <BudgetCategoryDonut items={items} />
          <BudgetCategoryDonutLegend items={items} />
        </div>
      </BudgetChartPanel>
      <BudgetChartPanel title={t("obra.orcamento.charts.barTitle")}>
        <BudgetCategoryBarChart items={items} />
      </BudgetChartPanel>
    </div>
  )
}
