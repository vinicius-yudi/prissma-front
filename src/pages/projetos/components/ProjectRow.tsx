import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { Fachada } from "@/shared/components/ui/fachada/Fachada"
import { estimateFloors, roofFor } from "@/shared/components/ui/fachada/fachadaGeometry"
import { Progress } from "@/shared/components/ui/progress/Progress"
import { StatusBadge } from "@/shared/components/ui/status-badge/StatusBadge"
import type { Project } from "@/shared/types/project"
import { dateProgress } from "@/shared/utils/status"

import { useProjectProgress } from "../hooks/useProjectProgress"
import { ProjectDeadline } from "./ProjectDeadline"

/** A obra em uma linha, para a visualização em lista. */
export function ProjectRow({ project }: { project: Project }) {
  const { t } = useTranslation()
  const { progress } = useProjectProgress(project.id)
  const value = progress ?? 0

  return (
    <Link
      to={`/obras/${project.id}/visao-geral`}
      className="group grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-4 rounded-lg bg-surface px-4 py-3 hairline transition-colors hover:bg-raised/50 md:grid-cols-[64px_minmax(0,2fr)_minmax(0,1.4fr)_10.5rem_9rem]"
    >
      <div className="blueprint-fine rounded-[10px] bg-raised">
        <Fachada
          progress={value}
          seed={project.id}
          floors={estimateFloors(project.builtArea, project.landArea)}
          roof={roofFor(project.projectType)}
          showDims={false}
          className="h-12 w-16"
        />
      </div>
      <div className="min-w-0">
        <p className="t-section truncate text-[15px] text-ink">{project.title}</p>
        <p className="truncate text-[12.5px] text-meta">{project.address}</p>
      </div>
      <div className="hidden items-center gap-3 md:flex">
        <Progress
          value={value}
          expected={dateProgress(project.plannedStartDate, project.plannedEndDate)}
          height={6}
          label={t("projects.card.progress")}
          className="flex-1"
        />
        <span className="t-data w-10 text-right text-ink-2">{progress === null ? "—" : `${value}%`}</span>
      </div>
      {/* Colunas de largura fixa: cada linha é um grid próprio, e com `auto` o
          tamanho do texto do prazo/status empurrava a barra para lugares diferentes. */}
      <ProjectDeadline project={project} className="hidden truncate md:inline" />
      <div className="justify-self-end">
        <StatusBadge status={project.status} plannedEndDate={project.plannedEndDate} kind="project" />
      </div>
    </Link>
  )
}
