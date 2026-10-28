import { useTranslation } from "react-i18next"
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { formatCompactCurrency, formatCurrency } from "@/shared/utils/formatters"

import type { BudgetMonthPoint } from "../../types/analytics"
import { buildBudgetCurve, formatMonth } from "../../utils/analyticsData"
import { ChartLegend } from "./ChartLegend"
import { ChartTooltip } from "./ChartTooltip"
import { AXIS_TICK, CHART_HEIGHT, CHART_MARGIN, CURSOR, GRID_STROKE, PLANNED_DASH, SERIES } from "./chartTheme"

/** "Orçamento previsto vs. executado ao longo do tempo", em valores acumulados. */
export function BudgetCurveChart({ points }: { points: BudgetMonthPoint[] }) {
  const { t, i18n } = useTranslation()
  const data = buildBudgetCurve(points)
  const plannedLabel = t("relatorios.series.planned")
  const executedLabel = t("relatorios.series.executed")

  return (
    <div>
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <LineChart data={data} margin={CHART_MARGIN}>
          <CartesianGrid stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="month" tickFormatter={(month: string) => formatMonth(month, i18n.language)} tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(value: number) => formatCompactCurrency(value)} tick={AXIS_TICK} axisLine={false} tickLine={false} width={76} />
          <Tooltip
            cursor={CURSOR}
            content={<ChartTooltip formatLabel={(month) => formatMonth(month, i18n.language)} formatValue={(value) => formatCurrency(value)} />}
          />
          <Line type="monotone" dataKey="planned" name={plannedLabel} stroke={SERIES.planned} strokeWidth={1.5} strokeDasharray={PLANNED_DASH} dot={false} />
          <Line type="monotone" dataKey="executed" name={executedLabel} stroke={SERIES.executed} strokeWidth={2.5} dot={{ r: 2.5, fill: SERIES.executed }} />
        </LineChart>
      </ResponsiveContainer>
      <ChartLegend
        items={[
          { label: plannedLabel, color: SERIES.planned, dashed: true },
          { label: executedLabel, color: SERIES.executed },
        ]}
      />
    </div>
  )
}
