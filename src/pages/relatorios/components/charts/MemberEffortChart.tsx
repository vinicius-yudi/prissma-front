import { useTranslation } from "react-i18next"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import type { MemberEffort } from "../../utils/analyticsData"
import { ChartLegend } from "./ChartLegend"
import { ChartTooltip } from "./ChartTooltip"
import { AXIS_TICK, BAR_CURSOR, CHART_MARGIN, GRID_STROKE, SERIES } from "./chartTheme"

const ROW_HEIGHT = 34
const AXIS_ROOM = 36
const STACK = "effort"

/**
 * Distribuição do esforço entre os membros (objetivo de negócio da seção
 * Analytics): tarefas atribuídas empilhadas em concluídas, abertas no prazo e
 * atrasadas. Membro sem tarefa aparece zerado — é a informação de alocação.
 */
export function MemberEffortChart({ members }: { members: MemberEffort[] }) {
  const { t } = useTranslation()
  const labels = {
    done: t("relatorios.series.done"),
    open: t("relatorios.series.open"),
    overdue: t("relatorios.series.overdue"),
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={members.length * ROW_HEIGHT + AXIS_ROOM}>
        <BarChart data={members} layout="vertical" margin={CHART_MARGIN} barSize={16}>
          <CartesianGrid stroke={GRID_STROKE} horizontal={false} />
          <XAxis type="number" allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="userName" tick={AXIS_TICK} axisLine={false} tickLine={false} width={132} />
          <Tooltip cursor={BAR_CURSOR}content={<ChartTooltip formatLabel={(name) => name} formatValue={(value) => String(value)} />} />
          <Bar dataKey="done" name={labels.done} stackId={STACK} fill={SERIES.done} />
          <Bar dataKey="open" name={labels.open} stackId={STACK} fill={SERIES.open} />
          <Bar dataKey="overdue" name={labels.overdue} stackId={STACK} fill={SERIES.overdue} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <ChartLegend
        items={[
          { label: labels.done, color: SERIES.done },
          { label: labels.open, color: SERIES.open },
          { label: labels.overdue, color: SERIES.overdue },
        ]}
      />
    </div>
  )
}
