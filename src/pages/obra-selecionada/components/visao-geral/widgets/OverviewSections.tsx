import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import type { StageSummary } from "@/pages/projetos/hooks/useProjectProgress"

import { DocumentosRecentes } from "../../DocumentosRecentes"
import { Gantt } from "../../gantt/Gantt"
import { SectionCard } from "../SectionCard"

/** Cronograma (Gantt) da obra — o bloco que antes vivia direto na VisaoGeral. */
export function ScheduleSection({ projectId, stages }: { projectId: number; stages: StageSummary[] }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const base = `/obras/${projectId}`
  const doneCount = stages.filter((s) => s.progress === 100).length

  return (
    <SectionCard
      title={t("obra.visaoGeral.schedule")}
      meta={t("obra.visaoGeral.stagesDone", { done: doneCount, total: stages.length })}
      action={{ to: `${base}/etapas`, label: t("obra.visaoGeral.manageStages") }}
    >
      <Gantt stages={stages} onSelect={() => navigate(`${base}/etapas`)} />
    </SectionCard>
  )
}

/** Documentos recentes da obra. */
export function DocumentsSection({ projectId }: { projectId: number }) {
  const { t } = useTranslation()
  return (
    <SectionCard
      title={t("obra.visaoGeral.recentDocs")}
      action={{ to: `/obras/${projectId}/documentos`, label: t("obra.visaoGeral.seeAllDocs") }}
    >
      <DocumentosRecentes projectId={projectId} />
    </SectionCard>
  )
}
