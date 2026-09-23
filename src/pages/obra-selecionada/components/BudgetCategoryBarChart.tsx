import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import type { BudgetItem } from "@/shared/types/budget"
import { formatCurrency } from "@/shared/utils/formatters"

import { TONE_COLOR } from "../utils/budgetChartColors"
import {
  calculatePercent,
  resolveBudgetTone,
  type BudgetTone,
} from "../utils/budgetMath"

interface BudgetCategoryBarChartProps {
  items: BudgetItem[]
}

interface BarDatum {
  id: number
  name: string
  percent: number
  spent: number
  planned: number
  tone: BudgetTone
}

interface BarTooltipPayload {
  payload?: BarDatum
}

interface BarTooltipProps {
  active?: boolean
  payload?: BarTooltipPayload[]
}

function BarTooltip({ active, payload }: BarTooltipProps) {
  if (!active || !payload?.length) return null
  const datum = payload[0]?.payload
  if (!datum) return null
  return (
    <div className="rounded-lg bg-surface-container-highest border border-outline-variant px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-on-surface">{datum.name}</p>
      <p className="text-xs text-on-surface-variant tabular-nums">
        {formatCurrency(datum.spent)} / {formatCurrency(datum.planned)}
      </p>
      <p className="text-[10px] text-on-surface-variant mt-0.5 tabular-nums">
        {Math.round(datum.percent)}%
      </p>
    </div>
  )
}

function buildBarData(items: BudgetItem[]): BarDatum[] {
  return items
    .filter((i) => i.plannedAmount > 0 || i.totalSpent > 0)
    .map((i) => {
      const percent = calculatePercent(i.totalSpent, i.plannedAmount)
      return {
        id: i.id,
        name: i.category,
        percent,
        spent: i.totalSpent,
        planned: i.plannedAmount,
        tone: resolveBudgetTone(percent, i.exceeded),
      }
    })
    .sort((a, b) => b.percent - a.percent)
}

export function BudgetCategoryBarChart({ items }: BudgetCategoryBarChartProps) {
  const { t } = useTranslation()

  const data = useMemo(() => buildBarData(items), [items])

  if (data.length === 0) return null

  const maxValue = Math.max(120, Math.ceil(Math.max(...data.map((d) => d.percent)) / 10) * 10 + 10)
  const chartHeight = Math.max(180, 36 * data.length + 40)

  return (
    <div className="w-full" style={{ height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 30, left: 8, bottom: 8 }}
        >
          <XAxis
            type="number"
            domain={[0, maxValue]}
            tickFormatter={(v: number) => `${v}%`}
            tick={{ fontSize: 11, fill: "currentColor" }}
            stroke="currentColor"
            className="text-on-surface-variant"
          />
          <YAxis
            type="category"
            dataKey="name"
            width={100}
            tick={{ fontSize: 11, fill: "currentColor" }}
            stroke="currentColor"
            className="text-on-surface-variant"
          />
          <Tooltip cursor={{ fill: "var(--pk-tint)" }} content={<BarTooltip />} />
          <ReferenceLine
            x={100}
            stroke="currentColor"
            strokeDasharray="3 3"
            className="text-on-surface-variant/60"
            label={{
              value: t("obra.orcamento.charts.limitLabel"),
              position: "top",
              fontSize: 10,
              fill: "currentColor",
            }}
          />
          <Bar dataKey="percent" radius={[0, 6, 6, 0]} barSize={20}>
            {data.map((entry) => (
              <Cell key={entry.id} fill={TONE_COLOR[entry.tone]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
