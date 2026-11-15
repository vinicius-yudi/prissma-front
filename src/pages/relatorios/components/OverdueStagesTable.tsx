import { useTranslation } from "react-i18next"

import { StatusBadge } from "@/shared/components/ui/status-badge/StatusBadge"

import type { OverdueStageLine } from "../types/analytics"
import { formatLocalDate } from "../utils/analyticsData"

interface OverdueStagesTableProps {
  stages: OverdueStageLine[]
  /** Coluna "Obra" só faz sentido no consolidado. */
  showProject: boolean
}

/**
 * "Etapas em atraso". O badge mostra o status REAL da etapa (sem o prazo, o
 * StatusBadge não o troca por "Em atraso") — o atraso já está na coluna ao lado.
 */
export function OverdueStagesTable({ stages, showProject }: OverdueStagesTableProps) {
  const { t, i18n } = useTranslation()

  return (
    <div className="-mx-5 overflow-x-auto sm:-mx-6">
      <table className="w-full min-w-[560px] text-left text-[13.5px]">
        <thead className="text-[12px] text-meta">
          <tr className="border-b border-border">
            <th className="px-5 pb-2.5 font-[560] sm:px-6">{t("relatorios.overdue.stage")}</th>
            {showProject && <th className="px-3 pb-2.5 font-[560]">{t("relatorios.overdue.project")}</th>}
            <th className="px-3 pb-2.5 font-[560]">{t("relatorios.overdue.due")}</th>
            <th className="px-3 pb-2.5 text-right font-[560]">{t("relatorios.overdue.late")}</th>
            <th className="px-5 pb-2.5 text-right font-[560] sm:px-6">{t("relatorios.overdue.status")}</th>
          </tr>
        </thead>
        <tbody>
          {stages.map((stage) => (
            <tr key={stage.stageId} className="border-b border-border last:border-0">
              <td className="px-5 py-3 font-[600] text-ink sm:px-6">{stage.stageName}</td>
              {showProject && <td className="px-3 py-3 text-ink-2">{stage.projectTitle}</td>}
              <td className="t-data px-3 py-3 text-ink-2">{formatLocalDate(stage.plannedEndDate, i18n.language)}</td>
              <td className="t-data px-3 py-3 text-right font-[640] text-danger">
                {t("relatorios.overdue.days", { count: stage.daysLate })}
              </td>
              <td className="px-5 py-3 text-right sm:px-6">
                <StatusBadge status={stage.stageStatus} kind="stage" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
