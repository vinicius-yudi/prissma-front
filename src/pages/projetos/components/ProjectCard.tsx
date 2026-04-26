import { Calendar, MapPin } from "lucide-react"
import type { CSSProperties } from "react"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import { ProjectStatus, type Project } from "@/shared/types/project"

const STATUS_KEYS: Record<ProjectStatus, string> = {
  [ProjectStatus.PLANNING]: "projects.status.planning",
  [ProjectStatus.IN_PROGRESS]: "projects.status.inProgress",
  [ProjectStatus.PAUSED]: "projects.status.paused",
  [ProjectStatus.COMPLETED]: "projects.status.completed",
  [ProjectStatus.CANCELLED]: "projects.status.cancelled",
}

const statusBadge = tv({
  base: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
  variants: {
    status: {
      [ProjectStatus.PLANNING]: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      [ProjectStatus.IN_PROGRESS]: "bg-teal-500/10 text-teal-600 border-teal-500/20",
      [ProjectStatus.PAUSED]: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      [ProjectStatus.COMPLETED]: "bg-green-500/10 text-green-600 border-green-500/20",
      [ProjectStatus.CANCELLED]: "bg-outline-variant/40 text-on-surface-variant border-outline-variant",
    },
  },
})

const statusDot = tv({
  base: "w-1.5 h-1.5 rounded-full flex-none",
  variants: {
    status: {
      [ProjectStatus.PLANNING]: "bg-blue-500",
      [ProjectStatus.IN_PROGRESS]: "bg-teal-500",
      [ProjectStatus.PAUSED]: "bg-amber-500",
      [ProjectStatus.COMPLETED]: "bg-green-500",
      [ProjectStatus.CANCELLED]: "bg-on-surface-variant",
    },
  },
})

const progressBar = tv({
  base: "h-full rounded-full transition-all",
  variants: {
    status: {
      [ProjectStatus.PLANNING]: "bg-blue-500",
      [ProjectStatus.IN_PROGRESS]: "bg-teal-500",
      [ProjectStatus.PAUSED]: "bg-amber-500",
      [ProjectStatus.COMPLETED]: "bg-green-500",
      [ProjectStatus.CANCELLED]: "bg-on-surface-variant/40",
    },
  },
})

const DATE_SEPARATOR = "→"
const NO_DATE = "—"

function formatDate(dateStr: string | null): string {
  if (!dateStr) return NO_DATE
  return new Date(dateStr).toLocaleDateString("pt-BR")
}

function calcProgress(start: string | null, end: string | null): number {
  if (!start || !end) return 0
  const startMs = new Date(start).getTime()
  const endMs = new Date(end).getTime()
  const nowMs = Date.now()
  if (endMs <= startMs) return 0
  const raw = ((nowMs - startMs) / (endMs - startMs)) * 100
  return Math.max(0, Math.min(100, Math.round(raw)))
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
    return <span className="text-sm font-semibold text-green-600">{t("projects.card.completed")}</span>
  }
  if (status === ProjectStatus.CANCELLED) {
    return <span className="text-sm font-medium text-on-surface-variant">{t("projects.card.cancelled")}</span>
  }
  if (days === null) {
    return <span className="text-sm text-on-surface-variant">{NO_DATE}</span>
  }
  if (days < 0) {
    return <span className="text-sm font-semibold text-red-500">{t("projects.card.overdue")}</span>
  }
  if (days === 0) {
    return <span className="text-sm font-semibold text-amber-600">{t("projects.card.dueToday")}</span>
  }
  return (
    <span className="text-sm font-medium text-teal-600">
      {t("projects.card.daysRemaining", { count: days })}
    </span>
  )
}

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { t } = useTranslation()
  const progress = calcProgress(project.plannedStartDate, project.plannedEndDate)
  const daysRemaining = calcDaysRemaining(project.plannedEndDate)
  const progressBarStyle: CSSProperties = { width: `${progress}%` }

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 flex flex-col gap-4 hover:bg-surface-container-low hover:border-outline transition-all duration-200">
      <div className="flex items-start justify-between gap-2">
        <span className={statusBadge({ status: project.status })}>
          <span className={statusDot({ status: project.status })} />
          {t(STATUS_KEYS[project.status])}
        </span>
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
          <span className="font-semibold text-on-surface-variant">{progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
          <div className={progressBar({ status: project.status })} style={progressBarStyle} />
        </div>
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
