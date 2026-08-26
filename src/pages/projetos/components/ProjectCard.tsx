import { Calendar, MapPin } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { Num } from "@/shared/components/ui/num/Num"
import { Progress } from "@/shared/components/ui/progress/Progress"
import { StatusBadge } from "@/shared/components/ui/status-badge/StatusBadge"
import { ProjectStatus, type Project } from "@/shared/types/project"
import { dateProgress, deriveStatus } from "@/shared/utils/status"

const DATE_SEPARATOR = "→"
const NO_DATE = "—"

function formatDate(dateStr: string | null): string {
  if (!dateStr) return NO_DATE
  return new Date(dateStr).toLocaleDateString("pt-BR")
}

function calcDaysRemaining(end: string | null): number | null {
  if (!end) return null
  return Math.round((new Date(end).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

interface DaysDisplayProps {
  days: number | null
  status: ProjectStatus
}

function DaysDisplay({ days, status }: DaysDisplayProps) {
  const { t } = useTranslation()

  if (status === ProjectStatus.COMPLETED) {
    return <span className="text-sm font-semibold text-ok">{t("projects.card.completed")}</span>
  }
  if (status === ProjectStatus.CANCELLED) {
    return <span className="text-sm font-medium text-on-surface-variant">{t("projects.card.cancelled")}</span>
  }
  if (days === null) {
    return <span className="text-sm text-on-surface-variant">{NO_DATE}</span>
  }
  if (days < 0) {
    return <span className="text-sm font-semibold text-danger">{t("projects.card.overdue")}</span>
  }
  if (days === 0) {
    return <span className="text-sm font-semibold text-warn">{t("projects.card.dueToday")}</span>
  }
  return (
    <span className="text-sm font-medium text-on-surface-variant">
      {t("projects.card.daysRemaining", { count: days })}
    </span>
  )
}

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const progress = dateProgress(project.plannedStartDate, project.plannedEndDate)
  const daysRemaining = calcDaysRemaining(project.plannedEndDate)

  // O preenchimento segue o estado: ouro no curso normal, verde ao concluir,
  // vermelho em atraso (Style Guide v2 §5).
  const { state } = deriveStatus({
    status: project.status,
    plannedEndDate: project.plannedEndDate,
  })
  const projectTone = state === "late" ? "danger" : state === "done" ? "ok" : "gold"

  // Editar e excluir moram na Visão geral da obra. No card eles surgiam no
  // hover sobre a mesma área do tipo da obra, que sumia para dar lugar a eles —
  // dois destinos de clique disputando o mesmo alvo, e uma ação destrutiva
  // escondida atrás do ponteiro.
  function handleCardClick() {
    navigate(`/obras/${project.id}/visao-geral`)
  }

  return (
    <div
      onClick={handleCardClick}
      className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 flex flex-col gap-4 hover:bg-surface-container-low hover:border-outline transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <StatusBadge status={project.status} plannedEndDate={project.plannedEndDate} />
        <span className="text-xs text-on-surface-variant uppercase tracking-wider font-medium mt-0.5 shrink-0">
          {project.projectType}
        </span>
      </div>

      <div className="space-y-1">
        <h3 className="font-semibold text-on-surface text-[17px] leading-snug line-clamp-1">
          {project.title}
        </h3>
        <div className="flex items-center gap-1.5 text-on-surface-variant text-sm">
          <MapPin size={13} className="flex-none" />
          <span className="line-clamp-1">{project.address}</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
        <Calendar size={13} className="flex-none" />
        <span>{formatDate(project.plannedStartDate)}</span>
        <span>{DATE_SEPARATOR}</span>
        <span>{formatDate(project.plannedEndDate)}</span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-on-surface-variant">{t("projects.card.progress")}</span>
          <Num className="font-semibold text-on-surface-variant">{progress}%</Num>
        </div>
        <Progress
          value={progress}
          height={6}
          tone={projectTone}
          label={t("projects.card.progress")}
        />
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-outline-variant">
        <span className="text-xs text-on-surface-variant">
          {t("projects.card.built", { area: project.builtArea })}
        </span>
        <DaysDisplay days={daysRemaining} status={project.status} />
      </div>
    </div>
  )
}
