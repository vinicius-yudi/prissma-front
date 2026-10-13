import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { useProjectProgress } from "@/pages/projetos/hooks/useProjectProgress"
import { ProjectStatus } from "@/shared/types/project"
import type { Project } from "@/shared/types/project"

import { useProjectBudgetQuery } from "../../hooks/useProjectBudgetQuery"
import { DocumentosRecentes } from "../DocumentosRecentes"
import { Gantt } from "../gantt/Gantt"
import { CurrentStageCard } from "./CurrentStageCard"
import { OverviewAttention } from "./OverviewAttention"
import { OverviewBudget } from "./OverviewBudget"
import { OverviewDiary } from "./OverviewDiary"
import { OverviewTeam } from "./OverviewTeam"
import { SectionCard } from "./SectionCard"

interface VisaoGeralProps {
  project: Project
}

/**
 * Visão geral da obra (DS v2). O cabeçalho grande (nome, avanço, prazo,
 * orçamento e fachada) já está acima, no <ObraHeader>; aqui fica o que pede
 * decisão, o cronograma, a etapa atual e os resumos de orçamento, equipe,
 * diário e documentos — cada um leva ao módulo cheio, nenhum edita.
 */
export function VisaoGeral({ project }: VisaoGeralProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { stages, currentStage } = useProjectProgress(project.id)
  const budget = useProjectBudgetQuery(project.id)
  const base = `/obras/${project.id}`
  const doneCount = stages.filter((s) => s.progress === 100).length
  const showCurrent = !!currentStage && project.status !== ProjectStatus.COMPLETED

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
      <div className="flex min-w-0 flex-col gap-6">
        <OverviewAttention projectId={project.id} stages={stages} budgetItems={budget?.items ?? []} />

        <SectionCard
          title={t("obra.visaoGeral.schedule")}
          meta={t("obra.visaoGeral.stagesDone", { done: doneCount, total: stages.length })}
          action={{ to: `${base}/etapas`, label: t("obra.visaoGeral.manageStages") }}
        >
          <Gantt stages={stages} onSelect={() => navigate(`${base}/etapas`)} />
        </SectionCard>

        {showCurrent && (
          <CurrentStageCard
            stage={currentStage}
            position={stages.findIndex((s) => s.id === currentStage.id) + 1}
            total={stages.length}
          />
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-6">
        <OverviewBudget projectId={project.id} budget={budget} />
        <OverviewTeam projectId={project.id} />
        <OverviewDiary projectId={project.id} />
        <SectionCard
          title={t("obra.visaoGeral.recentDocs")}
          action={{ to: `${base}/documentos`, label: t("obra.visaoGeral.seeAllDocs") }}
        >
          <DocumentosRecentes projectId={project.id} />
        </SectionCard>
      </div>
    </div>
  )
}
