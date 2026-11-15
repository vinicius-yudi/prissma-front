import { useTranslation } from "react-i18next"
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { formatCompactCurrency, formatCurrency } from "@/shared/utils/formatters"

import type { ExpenseCategoryLine } from "../../types/analytics"
import { ChartLegend } from "./ChartLegend"
import { ChartTooltip } from "./ChartTooltip"
import { AXIS_TICK, BAR_CURSOR, CHART_HEIGHT, CHART_MARGIN, GRID_STROKE, SERIES } from "./chartTheme"

const BAR_RADIUS: [number, number, number, number] = [0, 4, 4, 0]
const PLANNED_FILL = "var(--raised)"
const PLANNED_STROKE = "var(--border-strong)"
const ROW_HEIGHT = 30
const AXIS_ROOM = 36

/**
 * "Despesas por categoria": previsto × executado lado a lado. Barras
 * horizontais porque o consolidado junta as categorias de todas as obras e o
 * nome não cabe deitado no eixo. Categoria que estourou pinta o executado em
 * `danger` e é nomeada abaixo do gráfico — a cor não é a única pista.
 */
export function ExpensesByCategoryChart({ lines }: { lines: ExpenseCategoryLine[] }) {
  const { t } = useTranslation()
  const exceeded = lines.filter((line) => line.exceeded).map((line) => line.category)
  const plannedLabel = t("relatorios.series.planned")
  const executedLabel = t("relatorios.series.executed")

  return (
    <div>
      <ResponsiveContainer width="100%" height={Math.max(CHART_HEIGHT, lines.length * ROW_HEIGHT + AXIS_ROOM)}>
        <BarChart data={lines} layout="vertical" margin={CHART_MARGIN} barGap={2} barSize={10}>
          <CartesianGrid stroke={GRID_STROKE} horizontal={false} />
          <XAxis type="number" tickFormatter={(value: number) => formatCompactCurrency(value)} tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="category" tick={AXIS_TICK} axisLine={false} tickLine={false} width={128} />
          <Tooltip cursor={BAR_CURSOR} content={<ChartTooltip formatLabel={(category) => category} formatValue={(value) => formatCurrency(value)} />} />
          <Bar dataKey="plannedAmount" name={plannedLabel} fill={PLANNED_FILL} stroke={PLANNED_STROKE} radius={BAR_RADIUS} />
          <Bar dataKey="executedAmount" name={executedLabel} fill={SERIES.executed} radius={BAR_RADIUS}>
            {lines.map((line) => (
              <Cell key={line.category} fill={line.exceeded ? SERIES.exceeded : SERIES.executed} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <ChartLegend
        items={[
          { label: plannedLabel, color: PLANNED_STROKE },
          { label: executedLabel, color: SERIES.executed },
          ...(exceeded.length > 0 ? [{ label: t("relatorios.series.exceeded"), color: SERIES.exceeded }] : []),
        ]}
      />
      {exceeded.length > 0 && (
        <p className="mt-2 text-[12.5px] text-danger">{t("relatorios.charts.expenses.exceeded", { categories: exceeded.join(", ") })}</p>
      )}
    </div>
  )
}
