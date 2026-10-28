import { useTranslation } from "react-i18next"
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import type { BurndownPoint } from "../../types/analytics"
import { formatDayMonth } from "../../utils/analyticsData"
import { ChartLegend } from "./ChartLegend"
import { ChartTooltip } from "./ChartTooltip"
import { AXIS_TICK, CHART_HEIGHT, CHART_MARGIN, CURSOR, GRID_STROKE, PLANNED_DASH, SERIES } from "./chartTheme"

interface BurndownChartProps {
  points: BurndownPoint[]
  /** Todas as obras: avisa que a soma muda de base conforme cada obra entra e sai. */
  consolidated: boolean
}

/**
 * "Burndown de tarefas": tarefas restantes por semana, previsto × real. O
 * real vem `null` nas semanas futuras e a linha para no presente.
 */
export function BurndownChart({ points, consolidated }: BurndownChartProps) {
  const { t, i18n } = useTranslation()
  const plannedLabel = t("relatorios.series.plannedRemaining")
  const actualLabel = t("relatorios.series.actualRemaining")
  const formatWeek = (week: string) => t("relatorios.charts.burndown.week", { date: formatDayMonth(week, i18n.language) })

  return (
    <div>
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <LineChart data={points} margin={CHART_MARGIN}>
          <CartesianGrid stroke={GRID_STROKE} vertical={false} />
          <XAxis dataKey="week" tickFormatter={(week: string) => formatDayMonth(week, i18n.language)} tick={AXIS_TICK} axisLine={false} tickLine={false} minTickGap={12} />
          <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} width={36} />
          <Tooltip cursor={CURSOR} content={<ChartTooltip formatLabel={formatWeek} formatValue={(value) => String(value)} />} />
          <Line type="linear" dataKey="plannedRemaining" name={plannedLabel} stroke={SERIES.planned} strokeWidth={1.5} strokeDasharray={PLANNED_DASH} dot={false} />
          <Line type="linear" dataKey="actualRemaining" name={actualLabel} stroke={SERIES.executed} strokeWidth={2.5} dot={{ r: 2.5, fill: SERIES.executed }} />
        </LineChart>
      </ResponsiveContainer>
      <ChartLegend
        items={[
          { label: plannedLabel, color: SERIES.planned, dashed: true },
          { label: actualLabel, color: SERIES.executed },
        ]}
      />
      {/* O backend soma, por semana, só as obras cujo cronograma cobre aquela
          semana: o total de tarefas salta quando uma obra entra ou sai. */}
      {consolidated && <p className="mt-2 text-[12.5px] text-meta">{t("relatorios.charts.burndown.consolidatedHint")}</p>}
    </div>
  )
}
