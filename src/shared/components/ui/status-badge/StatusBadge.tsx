import { tv } from "tailwind-variants"
import { useTranslation } from "react-i18next"

import { ProjectStatus } from "@/shared/types/project"

const STATUS_KEYS: Record<ProjectStatus, string> = {
  [ProjectStatus.PLANNING]: "projects.status.planning",
  [ProjectStatus.IN_PROGRESS]: "projects.status.inProgress",
  [ProjectStatus.PAUSED]: "projects.status.paused",
  [ProjectStatus.COMPLETED]: "projects.status.completed",
  [ProjectStatus.CANCELLED]: "projects.status.cancelled",
}

const badge = tv({
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

const dot = tv({
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

interface StatusBadgeProps {
  status: ProjectStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useTranslation()
  return (
    <span className={badge({ status })}>
      <span className={dot({ status })} />
      {t(STATUS_KEYS[status])}
    </span>
  )
}
