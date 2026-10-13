import { useTranslation } from "react-i18next"

import type { StageSummary } from "@/pages/projetos/hooks/useProjectProgress"
import { daysUntil } from "@/pages/projetos/utils/projectDeadline"
import { Progress } from "@/shared/components/ui/progress/Progress"
import { StatusBadge } from "@/shared/components/ui/status-badge/StatusBadge"
import { formatDate } from "@/shared/utils/formatters"

interface CurrentStageCardProps {
  stage: StageSummary
  /** Posição da etapa (1-based) e total, para "Etapa atual · 03 de 09". */
  position: number
  total: number
}

/** A etapa em andamento: nome `t-title-sm`, status, trena, datas e tarefas. */
export function CurrentStageCard({ stage, position, total }: CurrentStageCardProps) {
  const { t } = useTranslation()
  const late = stage.daysLate > 0
  const days = daysUntil(stage.plannedEndDate)
  const done = stage.taskStatusCounts.DONE ?? 0

  return (
    <section className="rounded-lg bg-surface p-5 hairline sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="t-num text-[13px] text-meta">
            {t("obra.visaoGeral.current.label", {
              position: String(position).padStart(2, "0"),
              total: String(total).padStart(2, "0"),
            })}
          </p>
          <h3 className="t-title-sm mt-1 text-[26px] text-ink">{stage.name}</h3>
          {stage.description && <p className="mt-1 max-w-[56ch] text-[14px] text-ink-2">{stage.description}</p>}
        </div>
        <StatusBadge status={stage.status} plannedEndDate={stage.plannedEndDate} />
      </div>

      <div className="mt-5 flex items-center gap-4">
        <Progress
          value={stage.progress}
          height={10}
          tone={late ? "danger" : "gold"}
          label={t("obra.visaoGeral.current.progress")}
          className="flex-1"
        />
        <span className="t-kpi text-[20px] text-ink">{stage.progress}%</span>
      </div>

      <p className="t-num mt-2 text-[12.5px] text-meta">
        {stage.plannedStartDate ? formatDate(stage.plannedStartDate) : "—"} →{" "}
        {stage.plannedEndDate ? formatDate(stage.plannedEndDate) : "—"}
        {days !== null && " · "}
        {days !== null && late && t("obra.visaoGeral.attention.daysLate", { count: stage.daysLate })}
        {days !== null && !late && t("obra.visaoGeral.current.daysLeft", { count: Math.max(0, days) })}
      </p>
      {stage.totalTarefas > 0 && (
        <p className="mt-3 text-[13.5px] text-ink-2">
          {t("obra.visaoGeral.current.tasks", { done, total: stage.totalTarefas })}
        </p>
      )}
    </section>
  )
}
