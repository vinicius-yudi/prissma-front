import { AlertTriangle } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { tv } from "tailwind-variants"

import { Fachada } from "@/shared/components/ui/fachada/Fachada"
import { estimateFloors, roofFor } from "@/shared/components/ui/fachada/fachadaGeometry"
import { Progress } from "@/shared/components/ui/progress/Progress"
import { StatusBadge } from "@/shared/components/ui/status-badge/StatusBadge"
import type { Project } from "@/shared/types/project"
import { dateProgress, deriveStatus } from "@/shared/utils/status"

import { useProjectProgress } from "../hooks/useProjectProgress"
import { ProjectDeadline } from "./ProjectDeadline"

/** Mais que isso atrás do esperado, o percentual fica `danger` (DS v2, Card). */
const BEHIND_THRESHOLD = 8

const percent = tv({
  base: "t-kpi text-[26px]",
  variants: {
    behind: {
      true: "text-danger",
      false: "text-ink",
    },
  },
})

type TapeTone = "gold" | "ok" | "danger"

/** Concluída em verde; atrasada ou atrás do esperado em perigo; o resto em ouro. */
function tapeTone(done: boolean, trouble: boolean): TapeTone {
  if (done) return "ok"
  if (trouble) return "danger"
  return "gold"
}

interface ProjectCardProps {
  project: Project
}

/**
 * Card de obra (DS v2): fachada em prancha no topo, avanço físico em `t-kpi`,
 * trena com o marcador de onde a obra deveria estar hoje, etapa atual e prazo.
 * Sobe 2px com `shadow-soft` no hover, e o tracejado da fachada anda.
 */
export function ProjectCard({ project }: ProjectCardProps) {
  const { t } = useTranslation()
  const { progress, lateCount, currentStage } = useProjectProgress(project.id)
  const expected = dateProgress(project.plannedStartDate, project.plannedEndDate)
  const { state } = deriveStatus({ status: project.status, plannedEndDate: project.plannedEndDate })

  const value = progress ?? 0
  const behind = progress !== null && expected - value >= BEHIND_THRESHOLD
  const tone = tapeTone(state === "done", behind || state === "late")

  return (
    <Link
      to={`/obras/${project.id}/visao-geral`}
      className="group flex flex-col overflow-hidden rounded-[18px] bg-surface hairline transition-[box-shadow,translate] duration-300 hover:-translate-y-0.5 hover:shadow-soft motion-reduce:transition-none"
    >
      <div className="blueprint relative bg-raised px-6 pt-10">
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <StatusBadge status={project.status} plannedEndDate={project.plannedEndDate} kind="project" />
          {lateCount > 0 && (
            <span
              className="t-num inline-flex h-6 items-center gap-1 rounded-pill bg-danger-soft px-2 text-[12px] font-semibold text-danger"
              title={t("projects.card.lateStages", { count: lateCount })}
            >
              <AlertTriangle size={12} />
              {lateCount}
            </span>
          )}
        </div>
        <Fachada
          progress={value}
          seed={project.id}
          floors={estimateFloors(project.builtArea, project.landArea)}
          roof={roofFor(project.projectType)}
          showDims={false}
          className="mx-auto h-36 w-full max-w-[260px]"
        />
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="min-w-0">
          <h3 className="t-section truncate text-[17px] text-ink">{project.title}</h3>
          <p className="mt-0.5 truncate text-[13px] text-meta">{project.address}</p>
        </div>

        <div>
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <span className={percent({ behind })}>{progress === null ? "—" : `${value}%`}</span>
            <span className="truncate text-[12.5px] text-ink-2">
              {currentStage ? currentStage.name : t("projects.card.noStage")}
            </span>
          </div>
          <Progress value={value} expected={expected} tone={tone} label={t("projects.card.progress")} />
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
          <span className="t-num text-[12.5px] text-meta">{t("projects.card.built", { area: project.builtArea })}</span>
          <ProjectDeadline project={project} />
        </div>
      </div>
    </Link>
  )
}
