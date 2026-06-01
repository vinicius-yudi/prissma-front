import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

import type { BudgetItem } from "@/shared/types/budget"
import { formatCurrency } from "@/shared/utils/formatters"

import { donutColor } from "../utils/budgetChartColors"

interface BudgetCategoryDonutProps {
  items: BudgetItem[]
}

interface DonutDatum {
  id: number
  name: string
  value: number
}

interface DonutTooltipPayload {
  payload?: DonutDatum
}

interface DonutTooltipProps {
  active?: boolean
  payload?: DonutTooltipPayload[]
  total: number
}

function DonutTooltip({ active, payload, total }: DonutTooltipProps) {
  const { t } = useTranslation()
  if (!active || !payload?.length) return null
  const datum = payload[0]?.payload
  if (!datum) return null
  const percent = total > 0 ? Math.round((datum.value / total) * 100) : 0
  return (
    <div className="rounded-lg bg-surface-container-highest border border-outline-variant px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-on-surface">{datum.name}</p>
      <p className="text-xs text-on-surface-variant tabular-nums">
        {formatCurrency(datum.value)}
      </p>
      <p className="text-[10px] text-on-surface-variant mt-0.5">
        {t("obra.orcamento.charts.percentOfTotal", { percent })}
      </p>
    </div>
  )
}

export function BudgetCategoryDonut({ items }: BudgetCategoryDonutProps) {
  const data = useMemo<DonutDatum[]>(
    () =>
      items
        .filter((i) => i.totalSpent > 0)
        .map((i) => ({ id: i.id, name: i.category, value: i.totalSpent })),
    [items],
  )

  const total = useMemo(() => data.reduce((acc, d) => acc + d.value, 0), [data])

  if (data.length === 0) return null

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="55%"
            outerRadius="85%"
            paddingAngle={2}
            stroke="none"
          >
            {data.map((entry, idx) => (
              <Cell key={entry.id} fill={donutColor(idx)} />
            ))}
          </Pie>
          <Tooltip content={<DonutTooltip total={total} />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
