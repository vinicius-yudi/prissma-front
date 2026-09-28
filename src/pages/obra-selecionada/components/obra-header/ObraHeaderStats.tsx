import { CalendarRange } from "lucide-react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { ProjectDeadline } from "@/pages/projetos/components/ProjectDeadline"
import { Progress } from "@/shared/components/ui/progress/Progress"
import { Ticker } from "@/shared/components/ui/ticker/Ticker"
import type { Project } from "@/shared/types/project"
import { formatCurrency, formatDate } from "@/shared/utils/formatters"

import type { ObraHeaderData } from "../../hooks/useObraHeader"
import { paceKey } from "./obraHeaderText"

const pace = tv({
  base: "text-[12.5px] font-semibold",
  variants: {
    tone: {
      late: "text-danger",
      behind: "text-ink-2",
      onTrack: "text-ink-2",
      ahead: "text-success",
    },
  },
})

const budgetValue = tv({
  base: "t-section mt-1 text-[19px]",
  variants: { exceeded: { true: "text-danger", false: "text-ink" } },
})

interface ObraHeaderStatsProps {
  project: Project
  data: ObraHeaderData
}

/**
 * Números do cabeçalho grande: avanço físico com a trena e o ritmo em relação
 * ao esperado para hoje, prazo e orçamento — cada um com a frase que diz o
 * que o número significa.
 */
export function ObraHeaderStats({ project, data }: ObraHeaderStatsProps) {
  const { t } = useTranslation()
  const progress = data.progress.progress ?? 0

  return (
    <div className="mt-8 grid gap-6 sm:grid-cols-2 2xl:grid-cols-[minmax(0,1.5fr)_repeat(2,minmax(0,1fr))]">
      <div className="sm:col-span-2 2xl:col-span-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[13px] text-meta">{t("projects.card.progress")}</p>
          {data.pace && (
            <p className={pace({ tone: data.pace.tone })}>{t(paceKey(data.pace), { count: data.pace.points })}</p>
          )}
        </div>
        <p className="t-kpi mt-1 text-[44px] text-ink">
          {data.progress.progress === null ? "—" : <Ticker value={progress} />}
          <span className="text-[22px] text-meta">%</span>
        </p>
        <Progress value={progress} expected={data.expected} height={12} className="mt-3" label={t("projects.card.progress")} />
        {data.expected !== undefined && (
          <p className="mt-2 text-[12px] text-meta">{t("obra.header.expectedHint", { value: data.expected })}</p>
        )}
      </div>

      <div>
        <p className="text-[13px] text-meta">{t("obra.header.deadline")}</p>
        <ProjectDeadline project={project} className="t-section mt-1 block text-[19px]" />
        {project.plannedEndDate && (
          <p className="mt-1 inline-flex items-center gap-1.5 text-[12.5px] text-ink-2">
            <CalendarRange size={13} className="text-meta" />
            {t("obra.header.until", { date: formatDate(project.plannedEndDate) })}
          </p>
        )}
      </div>

      <div>
        <p className="text-[13px] text-meta">{t("obra.header.budget")}</p>
        {data.budget ? (
          <>
            <p className={budgetValue({ exceeded: data.budget.exceeded })}>
              {t("obra.header.budgetUsed", { percent: data.budget.percent })}
            </p>
            <p className="t-num mt-1 text-[12.5px] text-ink-2">
              {t("obra.header.budgetOf", {
                spent: formatCurrency(data.budget.spent),
                planned: formatCurrency(data.budget.planned),
              })}
            </p>
          </>
        ) : (
          <p className="t-section mt-1 text-[19px] text-meta">{t("obra.header.noBudget")}</p>
        )}
      </div>
    </div>
  )
}
